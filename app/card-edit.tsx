import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useGlobalSearchParams } from 'expo-router';
import AdminShell from '../components/admin/AdminShell';
import { useAuthUser } from '../store/auth';
import { fetchCard, updateCard, deleteCard, type CardData } from '../api/cards';
import TracingReader from '../components/TracingReader';
import {
  CARD_TYPES, CONTENT_FIELDS, NEW_LETTER_SECTIONS,
  type PageDraft, type NLSection,
  parseBookPages, contentToFieldValues, buildContent, getDefaultNLSections,
} from '../constants/cards';
import BookPageEditor from '../components/admin/BookPageEditor';

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CardEditScreen() {
  const { cardId: cardIdParam } = useGlobalSearchParams<{ cardId: string }>();
  const cardId = Number(cardIdParam);
  const user = useAuthUser();

  console.log('[card-edit] render — cardIdParam:', cardIdParam, 'cardId:', cardId);

  const [card, setCard]               = useState<CardData | null>(null);
  const [title, setTitle]             = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [bookPages, setBookPages]     = useState<PageDraft[]>([{ text: '', image: '' }]);
  const [nlSections, setNlSections]   = useState<Record<string, NLSection>>(getDefaultNLSections());
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    console.log('[card-edit] useEffect — cardId:', cardId, 'isNaN:', isNaN(cardId));
    if (!cardId || isNaN(cardId)) {
      console.log('[card-edit] invalid cardId — stopping loader');
      setError('ბარათის ID არ არის მითითებული.');
      setLoading(false);
      return;
    }
    console.log('[card-edit] fetching card', cardId);
    fetchCard(cardId)
      .then(c => {
        console.log('[card-edit] card loaded:', c.id, c.type);
        setCard(c);
        setTitle(c.title ?? '');
        const content = c.content ?? {};
        if (c.type === 'book') {
          setBookPages(parseBookPages(content));
        } else {
          setFieldValues(contentToFieldValues(c.type, content));
        }
        if (c.type === 'new_letter') {
          const defaults = getDefaultNLSections();
          const saved = content.sections ?? {};
          const merged: Record<string, NLSection> = {};
          for (const s of NEW_LETTER_SECTIONS) {
            merged[s.key] = { ...defaults[s.key], ...saved[s.key] };
          }
          setNlSections(merged);
        }
      })
      .catch((err) => {
        console.log('[card-edit] fetch error:', err);
        setError('ბარათი ვერ ჩაიტვირთა.');
      })
      .finally(() => {
        console.log('[card-edit] fetch done, loading=false');
        setLoading(false);
      });
  }, [cardId]);

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'bottom']}>
        <View style={styles.center}><Text style={styles.errorText}>წვდომა შეზღუდულია.</Text></View>
      </SafeAreaView>
    );
  }

  async function handleSave() {
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      const content = card.type === 'book'
        ? { pages: bookPages.filter(p => p.text.trim() || p.image.trim()) }
        : card.type === 'new_letter'
          ? { ...buildContent(card.type, fieldValues), sections: nlSections }
          : buildContent(card.type, fieldValues);
      await updateCard(card.id, { title: title.trim() || undefined, content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('შენახვა ვერ მოხერხდა.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card) return;
    setDeleting(true);
    try {
      await deleteCard(card.id);
      router.canGoBack() ? router.back() : router.replace('/admin');
    } catch {
      setError('წაშლა ვერ მოხერხდა.');
      setDeleting(false);
    }
  }

  const meta = card ? CARD_TYPES.find(t => t.key === card.type)! : null;

  return (
    <AdminShell title="ბარათის რედაქტირება" activeMenu="cards">
      {/* Delete confirm modal */}
      <Modal visible={confirmDelete} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>ბარათის წაშლა</Text>
            <Text style={styles.dialogBody}>ნამდვილად გსურთ ამ ბარათის წაშლა?</Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && { opacity: 0.7 }]}
                onPress={() => setConfirmDelete(false)}
              >
                <Text style={styles.dialogBtnCancelText}>გაუქმება</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnDelete, pressed && { opacity: 0.7 }]}
                onPress={() => { setConfirmDelete(false); handleDelete(); }}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.dialogBtnDeleteText}>დიახ, წაშლა</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#374151" /></View>
      ) : error && !card ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : card && meta ? (
        <ScrollView contentContainerStyle={styles.body}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: meta.color + '18', borderColor: meta.color + '40' }]}>
            <Text style={styles.typeBadgeEmoji}>{meta.emoji}</Text>
            <Text style={[styles.typeBadgeLabel, { color: meta.color }]}>{meta.label}</Text>
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
              selectTextOnFocus
            />
          </View>

          {/* Book: visual page editor */}
          {card.type === 'book' ? (
            <BookPageEditor pages={bookPages} onChange={setBookPages} />
          ) : (
            <>
              {/* TracingReader preview for new_letter */}
              {card.type === 'new_letter' && (
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

              {/* Generic fields */}
              {CONTENT_FIELDS[card.type].map(f => (
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

              {/* New letter: section editors */}
              {card.type === 'new_letter' && (
                <View style={styles.sectionsBlock}>
                  <Text style={styles.sectionsHeader}>სექციები</Text>
                  {NEW_LETTER_SECTIONS.map(s => {
                    const sec = nlSections[s.key];
                    return (
                      <View key={s.key} style={styles.sectionCard}>
                        <Text style={styles.sectionName}>{s.defaultTitle}</Text>

                        {/* Hide toggle */}
                        <Pressable
                          style={styles.checkRow}
                          onPress={() => setNlSections(prev => ({
                            ...prev,
                            [s.key]: { ...prev[s.key], hidden: !prev[s.key].hidden },
                          }))}
                        >
                          <View style={[styles.checkbox, sec.hidden && styles.checkboxChecked]}>
                            {sec.hidden && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkLabel}>ამ სექციის დამალვა</Text>
                        </Pressable>

                        {/* Title */}
                        <View style={styles.field}>
                          <Text style={styles.fieldLabel}>სათაური</Text>
                          <TextInput
                            style={styles.input}
                            value={sec.title}
                            onChangeText={v => setNlSections(prev => ({
                              ...prev, [s.key]: { ...prev[s.key], title: v },
                            }))}
                            placeholder={s.defaultTitle}
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>

                        {/* Video URL (only for video sections) */}
                        {s.hasVideo && (
                          <View style={styles.field}>
                            <Text style={styles.fieldLabel}>ვიდეო URL</Text>
                            <TextInput
                              style={styles.input}
                              value={sec.video_url ?? ''}
                              onChangeText={v => setNlSections(prev => ({
                                ...prev, [s.key]: { ...prev[s.key], video_url: v },
                              }))}
                              placeholder="https://..."
                              placeholderTextColor="#9CA3AF"
                              autoCapitalize="none"
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, saved && styles.saveBtnDone, pressed && { opacity: 0.8 }]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>{saved ? 'შენახულია ✓' : 'შენახვა'}</Text>
            }
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setConfirmDelete(true)}
          >
            <Text style={styles.deleteBtnText}>ბარათის წაშლა</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  saveBtn:     { backgroundColor: '#374151', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnDone: { backgroundColor: '#10B981' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  deleteBtn:     { backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  deleteBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },

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

  sectionsBlock: { gap: 12 },
  sectionsHeader: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, gap: 10,
  },
  sectionName: { fontSize: 14, fontWeight: '700', color: '#374151' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  checkmark: { fontSize: 12, color: '#fff', fontWeight: '700' },
  checkLabel: { fontSize: 14, color: '#374151' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:  { width: 300, backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  dialogTitle:         { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  dialogBody:          { fontSize: 15, color: '#6B7280', lineHeight: 22 },
  dialogActions:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogBtn:           { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  dialogBtnCancel:     { backgroundColor: '#F3F4F6' },
  dialogBtnDelete:     { backgroundColor: '#EF4444' },
  dialogBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  dialogBtnDeleteText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
