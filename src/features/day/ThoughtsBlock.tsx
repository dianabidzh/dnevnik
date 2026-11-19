import { AutoTextarea } from "../../components/AutoTextarea";
import { useAutosaveText } from "../../lib/useAutosaveText";

interface Props {
  date: string;
  initial: string;
  onSave: (date: string, text: string) => void;
}

export function ThoughtsBlock({ date, initial, onSave }: Props) {
  const [value, setValue] = useAutosaveText(initial, (t) => onSave(date, t));
  return (
    <section className="card">
      <h3>Мысли и инсайты</h3>
      <AutoTextarea
        className="thoughts"
        value={value}
        onValueChange={setValue}
        rows={9}
        placeholder="Всё, что хочется записать сегодня…"
        aria-label="Мысли и инсайты"
      />
    </section>
  );
}
