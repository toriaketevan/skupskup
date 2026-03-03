import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthUser } from '../store/auth';
import { createCard, type Card } from '../api/cards';
import TracingReader from '../components/TracingReader';
import { CARD_TYPES, CONTENT_FIELDS, type PageDraft, buildContent } from '../constants/cards';
import BookPageEditor from '../components/BookPageEditor';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CardAddScreen() {
  const user = useAuthUser();
  const [selectedType, setSelectedType] = useState<Card | null>(null);
  const [title, setTitle]               = useState('');
  const [fieldValues, setFieldValues]   = useState<Record<string, string>>({});
  const [bookPages, setBookPages]       = useState<PageDraft[]>([{ text: '', image: '' }]);
  const [fastSound, setFastSound]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
        <View style={styles.center}><Text style={styles.errorText}>წვდომა შეზღუდულია.</Text></View>
      </SafeAreaView>
    );
  }

  function handleSelectType(key: Card) {
    setSelectedType(key);
    setBookPages([{ text: '', image: '' }]);
  }

  function handleBack() {
    if (selectedType) {
      setSelectedType(null);
      setTitle('');
      setFieldValues({});
      setBookPages([{ text: '', image: '' }]);
      setFastSound(false);
      setError(null);
    } else {
      router.canGoBack() ? router.back() : router.replace('/admin');
    }
  }

  async function handleSave() {
    if (!selectedType) return;
    setSaving(true);
    setError(null);
    try {
      const content = selectedType === 'book'
        ? { pages: bookPages.filter(p => p.text.trim() || p.image.trim()) }
        : { ...buildContent(selectedType, fieldValues), ...(selectedType === 'new_letter' ? { fast_sound: fastSound } : {}) };
      await createCard({ type: selectedType, title: title.trim() || undefined, content });
      router.canGoBack() ? router.back() : router.replace('/admin');
    } catch {
      setError('შენახვა ვერ მოხერხდა.');
    } finally {
      setSaving(false);
    }
  }

  const meta = selectedType ? CARD_TYPES.find(t => t.key === selectedType)! : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backText}>← უკან</Text>
        </Pressable>
        <Text style={styles.title}>
          {selectedType ? 'ბარათის შექმნა' : 'ბარათის ტიპი'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {!selectedType ? (
          /* Step 1: Type selector */
          <View style={styles.typeGrid}>
            {CARD_TYPES.map(t => (
              <Pressable
                key={t.key}
                style={({ pressed }) => [styles.typeBtn, { borderColor: t.color }, pressed && { opacity: 0.75 }]}
                onPress={() => handleSelectType(t.key)}
              >
                <Text style={styles.typeBtnEmoji}>{t.emoji}</Text>
                <Text style={[styles.typeBtnLabel, { color: t.color }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          /* Step 2: Form */
          <View style={styles.form}>
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: meta!.color + '18', borderColor: meta!.color + '40' }]}>
              <Text style={styles.typeBadgeEmoji}>{meta!.emoji}</Text>
              <Text style={[styles.typeBadgeLabel, { color: meta!.color }]}>{meta!.label}</Text>
            </View>

            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>სათაური</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="სათაური (არასავალდებულო)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Book: visual page editor */}
            {selectedType === 'book' ? (
              <BookPageEditor pages={bookPages} onChange={setBookPages} />
            ) : (
              <>
                {/* TracingReader preview for new_letter */}
                {selectedType === 'new_letter' && (
                  <View style={styles.previewBox}>
                    {fieldValues['letter'] ? (
                      <TracingReader
                        text={fieldValues['letter']}
                        fontSize={80}
                        accentColor="#6366F1"
                      />
                    ) : (
                      <Text style={styles.previewHint}>ასო შეიყვანეთ ქვემოთ — პრივიუ გამოჩნდება</Text>
                    )}
                  </View>
                )}

                {/* Fast / slow sound toggle — new_letter only */}
                {selectedType === 'new_letter' && (
                  <Pressable style={styles.checkRow} onPress={() => setFastSound(v => !v)}>
                    <View style={[styles.checkbox, fastSound && styles.checkboxChecked]}>
                      {fastSound && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkLabel}>სწრაფი ბგერა</Text>
                  </Pressable>
                )}

                {/* Generic fields */}
                {CONTENT_FIELDS[selectedType].map(f => (
                  <View key={f.key} style={styles.field}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={[styles.input, f.multiline && styles.inputMultiline]}
                      value={fieldValues[f.key] ?? ''}
                      onChangeText={v => setFieldValues(prev => ({ ...prev, [f.key]: v }))}
                      multiline={f.multiline}
                      textAlignVertical={f.multiline ? 'top' : 'auto'}
                      placeholder={f.label}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                ))}
              </>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>შექმნა</Text>
              }
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
  },
  backBtn:  { width: 70 },
  backText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },
  title:    { fontSize: 18, fontWeight: 'bold', color: '#374151', flex: 1, textAlign: 'center' },

  body: { padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  typeBtn: {
    width: '30%', minWidth: 100,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 18, alignItems: 'center', gap: 6,
  },
  typeBtnEmoji: { fontSize: 26 },
  typeBtnLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  form: { gap: 16 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  typeBadgeEmoji: { fontSize: 18 },
  typeBadgeLabel: { fontSize: 14, fontWeight: '700' },

  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#111827',
  },
  inputMultiline: { minHeight: 100 },

  saveBtn: { backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },

  previewBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  previewHint: {
    fontSize: 13,
    color: '#A78BFA',
    textAlign: 'center',
  },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#D1D5DB', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
});
