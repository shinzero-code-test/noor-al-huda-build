import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import { Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { jsonRequest } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';

const assistantSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()),
});

export default function AssistantScreen() {
  const [question, setQuestion] = useState('');
  const mutation = useMutation({
    mutationFn: () =>
      jsonRequest('/api/assistant/ask', assistantSchema, {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
  });

  return (
    <Page>
      <SectionHeader title="المساعد الإسلامي" subtitle="إجابات منضبطة بمصادر شرعية" />
      <SurfaceCard accent="blue">
        <TextInput style={styles.input} value={question} onChangeText={setQuestion} placeholder="اكتب سؤالك" placeholderTextColor={theme.colors.creamFaint} multiline textAlign="right" />
        <PrimaryButton label={mutation.isPending ? 'جاري التحليل...' : 'اسأل الآن'} onPress={() => mutation.mutate()} disabled={!question.trim() || mutation.isPending} tone="emerald" />
        {mutation.data ? (
          <>
            <Text style={styles.answer}>{mutation.data.answer}</Text>
            <View style={styles.sources}>{mutation.data.sources.map((item) => <Text key={item} style={styles.source}>{item}</Text>)}</View>
          </>
        ) : null}
      </SurfaceCard>
    </Page>
  );
}

const styles = StyleSheet.create({
  input: { borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceStrong, color: theme.colors.cream, padding: 14, fontFamily: theme.fonts.body, minHeight: 120, textAlignVertical: 'top' },
  answer: { color: theme.colors.cream, fontFamily: theme.fonts.body, fontSize: 15, lineHeight: 25, textAlign: 'right' },
  sources: { gap: 6 },
  source: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBold, fontSize: 13, textAlign: 'right' },
});
