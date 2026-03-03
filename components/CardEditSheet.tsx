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
import { fetchCard, updateCard, deleteCard, type CardData } from '../api/cards';
import TracingReader from './TracingReader';
import { CARD_TYPES, CONTENT_FIELDS, type PageDraft, parseBookPages, contentToFieldValues, buildContent } from '../constants/cards';
import BookPageEditor from './BookPageEditor';

// ─── Sheet ─────────────────────────────────────────────────────────────────────

type Props = {
  cardId: number | null;
  onClose: () => void;
  onSaved: (card: CardData) => void;
  onDeleted: (cardId: number) => void;
};

export default function CardEditSheet({ cardId, onClose, onSaved, onDeleted }: Props) {
  const [card, setCard]               = useState<CardData | null>(null);
  const [title, setTitle]             = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [bookPages, setBookPages]     = useState<PageDraft[]>([{ text: '', image: '' }]);
  const [fastSound, setFastSound]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    setCard(null);
    setError(null);
    setSaved(false);
    fetchCard(cardId)
      .then(c => {
        setCard(c);
        setTitle(c.title ?? '');
        const content = c.content ?? {};
        if (c.type === 'book') {
          setBookPages(parseBookPages(content));
        } else {
          setFieldValues(contentToFieldValues(c.type, content));
        }
        setFastSound(c.type === 'new_letter' ? Boolean(content.fast_sound) : false);
      })
      .catch(() => setError('ბარათი ვერ ჩაიტვირთა.'))
      .finally(() => setLoading(false));
  }, [cardId]);

  async function handleSave() {
    if (!card) return;
    setSaving(true);
    setError(null);
    try {
      let content: Record<string, any>;
      if (card.type === 'book') {
        content = { pages: bookPages.filter(p => p.text.trim() || p.image.trim()) };
      } else {
        content = buildContent(card.type, fieldValues);
        if (card.type === 'new_letter') content.fast_sound = fastSound;
      }
      const updated = await updateCard(card.id, { title: title.trim() || undefined, content });
      onSaved(updated);
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
      onDeleted(card.id);
      onClose();
    } catch {
      setError('წაშლა ვერ მოხერხდა.');
      setDeleting(false);
    }
  }

  const meta = card ? CARD_TYPES.find(t => t.key === card.type)! : null;

  return (
    <Modal visible={cardId !== null} animationType="slide">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'bottom']}>
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

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>← უკან</Text>
          </Pressable>
          <Text style={styles.headerTitle}>ბარათის რედაქტირება</Text>
          <View style={styles.backBtn} />
        </View>

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

            {card.type === 'book' ? (
              <BookPageEditor pages={bookPages} onChange={setBookPages} />
            ) : (
              <>
                {card.type === 'new_letter' && (
                  <View style={styles.previewBox}>
                    {fieldValues['letter'] ? (
                      <TracingReader text={fieldValues['letter']} fontSize={80} accentColor="#6366F1" />
                    ) : (
                      <Text style={styles.previewHint}>ასო შეიყვანეთ ქვემოთ — პრივიუ გამოჩნდება</Text>
                    )}
                  </View>
                )}

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

                {card.type === 'new_letter' && (
                  <Pressable style={styles.checkRow} onPress={() => setFastSound(v => !v)}>
                    <View style={[styles.checkbox, fastSound && styles.checkboxChecked]}>
                      {fastSound && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkLabel}>სწრაფი ბგერა</Text>
                  </Pressable>
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
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EAECEF', backgroundColor: '#fff',
  },
  backBtn:     { width: 70 },
  backText:    { fontSize: 15, fontWeight: '600', color: '#6366F1' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', flex: 1, textAlign: 'center' },

  body:   { padding: 20, gap: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  typeBadgeEmoji: { fontSize: 18 },
  typeBadgeLabel: { fontSize: 14, fontWeight: '700' },

  field:      { gap: 4 },
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
    backgroundColor: '#F5F3FF', borderRadius: 14,
    borderWidth: 1, borderColor: '#DDD6FE',
    paddingVertical: 28, paddingHorizontal: 20,
    alignItems: 'center', minHeight: 130, justifyContent: 'center',
  },
  previewHint: { fontSize: 13, color: '#A78BFA', textAlign: 'center' },

  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#D1D5DB', backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  checkmark:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  checkLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },

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
