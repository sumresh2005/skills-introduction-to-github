import { AccessTokenRequest, makeRedirectUri, ResponseType, useAuthRequest } from 'expo-auth-session';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFriends } from '@/context/FriendsContext';
import { fetchFacebookBirthdays } from '@/lib/ics';
import { GOOGLE_CONTACTS_SCOPES, GOOGLE_DISCOVERY, fetchGoogleContacts } from '@/lib/google';

WebBrowser.maybeCompleteAuthSession();

function googleClientId(): string | undefined {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  return Platform.select({
    ios: extra.googleIosClientId,
    android: extra.googleAndroidClientId,
    default: extra.googleWebClientId,
  });
}

export default function ImportScreen() {
  const { importEntries } = useFriends();
  const [feedUrl, setFeedUrl] = useState('');
  const [busy, setBusy] = useState<'facebook' | 'google' | null>(null);

  const clientId = googleClientId();
  const redirectUri = makeRedirectUri({ scheme: 'friendcrm' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: clientId || 'not-configured',
      scopes: GOOGLE_CONTACTS_SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  const runFacebookImport = async () => {
    if (!feedUrl.trim()) return Alert.alert('Paste your Facebook birthdays webcal:// URL first.');
    setBusy('facebook');
    try {
      const entries = await fetchFacebookBirthdays(feedUrl.trim());
      const summary = await importEntries(entries);
      Alert.alert('Import complete', `${entries.length} birthdays found: ${summary.created.length} new, ${summary.updated.length} updated.`);
      router.back();
    } catch (err) {
      Alert.alert('Import failed', String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  const runGoogleImport = async () => {
    if (!clientId) {
      return Alert.alert(
        'Google sign-in is not configured',
        'Add googleIosClientId / googleAndroidClientId / googleWebClientId under "extra" in app.json (see README).'
      );
    }
    setBusy('google');
    try {
      const result = await promptAsync();
      if (result.type !== 'success' || !result.params.code) {
        if (result.type !== 'cancel') Alert.alert('Google sign-in did not complete');
        return;
      }
      const tokenResponse = await new AccessTokenRequest({
        clientId,
        redirectUri,
        code: result.params.code,
        extraParams: { code_verifier: request?.codeVerifier || '' },
      }).performAsync(GOOGLE_DISCOVERY);

      const entries = await fetchGoogleContacts(tokenResponse.accessToken);
      const summary = await importEntries(entries);
      Alert.alert('Import complete', `${entries.length} contacts found: ${summary.created.length} new, ${summary.updated.length} updated.`);
      router.back();
    } catch (err) {
      Alert.alert('Import failed', String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Facebook birthdays</Text>
      <Text style={styles.hint}>
        Facebook → Events → Birthdays → Export → copy the "Upcoming birthdays" webcal:// link.
      </Text>
      <TextInput
        style={styles.input}
        value={feedUrl}
        onChangeText={setFeedUrl}
        placeholder="webcal://www.facebook.com/ical/b.php?..."
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.button} onPress={runFacebookImport} disabled={busy !== null}>
        {busy === 'facebook' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Import Facebook birthdays</Text>}
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Google Contacts</Text>
      <Text style={styles.hint}>
        Signs in with your own Google account and reads only your saved contacts (never posted or shared anywhere).
        Requires a development build — see README.
      </Text>
      <Pressable style={styles.button} onPress={runGoogleImport} disabled={busy !== null || !request}>
        {busy === 'google' ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in & import Google contacts</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  hint: { fontSize: 12, color: '#888', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#d8d8de',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4f5bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e2ea', marginVertical: 24 },
});
