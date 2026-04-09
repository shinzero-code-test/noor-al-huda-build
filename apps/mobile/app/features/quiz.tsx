import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Page, PrimaryButton, SectionHeader, SurfaceCard } from '../../src/components/ui';
import { jsonRequest } from '../../src/lib/api';
import { theme } from '../../src/lib/theme';

const quizSchema = z.object({
  title: z.string(),
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number(),
    })
  ),
});

export default function QuizScreen() {
  const [topic, setTopic] = useState('السيرة');
  const [score, setScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const mutation = useMutation({
    mutationFn: () =>
      jsonRequest('/api/quiz/generate', quizSchema, {
        method: 'POST',
        body: JSON.stringify({ topic }),
      }),
  });

  function checkAnswers() {
    if (!mutation.data) return;
    let current = 0;
    mutation.data.questions.forEach((question, index) => {
      if (answers[index] === question.answerIndex) current += 1;
    });
    setScore(current);
  }

  return (
    <Page>
      <SectionHeader title="الاختبارات الشرعية" subtitle="أسئلة مولدة بالذكاء الاصطناعي" />
      <SurfaceCard accent="emerald">
        <View style={styles.topicsRow}>
          {['السيرة', 'الفقه', 'القرآن', 'الحديث'].map((item) => (
            <Pressable key={item} style={[styles.topicChip, topic === item ? styles.topicActive : null]} onPress={() => setTopic(item)}>
              <Text style={styles.topicText}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label={mutation.isPending ? 'جاري التوليد...' : 'أنشئ اختباراً'} onPress={() => mutation.mutate()} disabled={mutation.isPending} tone="emerald" />
      </SurfaceCard>
      {mutation.data ? (
        <SurfaceCard>
          <Text style={styles.quizTitle}>{mutation.data.title}</Text>
          {mutation.data.questions.map((question, qIndex) => (
            <View key={`${question.question}-${qIndex}`} style={styles.questionCard}>
              <Text style={styles.questionText}>{question.question}</Text>
              {question.options.map((option, index) => (
                <Pressable key={option} style={[styles.optionChip, answers[qIndex] === index ? styles.topicActive : null]} onPress={() => setAnswers((current) => ({ ...current, [qIndex]: index }))}>
                  <Text style={styles.optionText}>{option}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <PrimaryButton label="احسب النتيجة" onPress={checkAnswers} />
          {score != null ? <Text style={styles.result}>النتيجة: {score}/{mutation.data.questions.length}</Text> : null}
        </SurfaceCard>
      ) : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(201,168,76,0.15)' },
  topicActive: { backgroundColor: 'rgba(26,107,60,0.35)' },
  topicText: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBold, fontSize: 13 },
  quizTitle: { color: theme.colors.goldLight, fontFamily: theme.fonts.display, fontSize: 24, textAlign: 'right' },
  questionCard: { borderRadius: 18, padding: 14, backgroundColor: theme.colors.surfaceStrong, gap: 8 },
  questionText: { color: theme.colors.cream, fontFamily: theme.fonts.bodyBold, fontSize: 15, textAlign: 'right' },
  optionChip: { borderRadius: 14, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  optionText: { color: theme.colors.creamMuted, fontFamily: theme.fonts.body, fontSize: 14, textAlign: 'right' },
  result: { color: theme.colors.goldLight, fontFamily: theme.fonts.bodyBlack, fontSize: 18, textAlign: 'right' },
});
