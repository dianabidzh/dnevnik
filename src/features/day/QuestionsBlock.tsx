import { AutoTextarea } from "../../components/AutoTextarea";
import type { Question } from "../../db/schema";
import { useAutosaveText } from "../../lib/useAutosaveText";

function QuestionItem({ question, initial, onSave }: { question: Question; initial: string; onSave: (t: string) => void }) {
  const [value, setValue] = useAutosaveText(initial, onSave);
  return (
    <div className="qa">
      <label className="qa-label">
        {question.text}
        <AutoTextarea value={value} onValueChange={setValue} rows={2} />
      </label>
    </div>
  );
}

interface Props {
  date: string;
  questions: Question[];
  answers: Record<string, string>;
  onSave: (date: string, questionId: string, text: string) => void;
  onManage: () => void;
}

export function QuestionsBlock({ date, questions, answers, onSave, onManage }: Props) {
  return (
    <section className="card">
      <div className="block-head">
        <h3>Вопросы для себя</h3>
        <button className="link" onClick={onManage}>
          Изменить
        </button>
      </div>
      {questions.length === 0 ? (
        <p className="muted">Пока нет вопросов. Нажмите «Изменить», чтобы придумать свои.</p>
      ) : (
        questions.map((q) => (
          <QuestionItem
            key={date + q.id}
            question={q}
            initial={answers[q.id] ?? ""}
            onSave={(t) => onSave(date, q.id, t)}
          />
        ))
      )}
    </section>
  );
}
