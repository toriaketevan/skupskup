import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type PageDraft } from '../../constants/cards';

export default function BookPageEditor({ pages, onChange }: { pages: PageDraft[]; onChange: (pages: PageDraft[]) => void }) {
  function update(i: number, field: keyof PageDraft, value: string) {
    const next = [...pages];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }
  function remove(i: number) { onChange(pages.filter((_, j) => j !== i)); }
  function add()              { onChange([...pages, { text: '', image: '' }]); }

  return (
    <View style={styles.container}>
      {pages.map((p, i) => (
        <View key={i} style={styles.pageCard}>
          <View style={styles.pageHeader}>
            <View style={styles.pageNumBadge}><Text style={styles.pageNumText}>გვერდი {i + 1}</Text></View>
            {pages.length > 1 && (
              <Pressable onPress={() => remove(i)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.label}>ტექსტი</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={p.text}
            onChangeText={v => update(i, 'text', v)}
            multiline
            textAlignVertical="top"
            placeholder="გვერდის ტექსტი..."
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.label}>სურათის URL</Text>
          <TextInput
            style={styles.input}
            value={p.image}
            onChangeText={v => update(i, 'image', v)}
            placeholder="https://... (არასავალდებულო)"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      ))}
      <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.75 }]} onPress={add}>
        <Text style={styles.addBtnText}>+ გვერდის დამატება</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { gap: 12 },
  pageCard:   { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 8 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageNumBadge:  { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  pageNumText:   { fontSize: 12, fontWeight: '700', color: '#fff' },
  removeBtn:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
  label:     { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4 },
  input:     { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  inputMulti: { minHeight: 90 },
  addBtn:    { borderWidth: 1.5, borderColor: '#6366F1', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
});
