import { useCallback, useEffect, useRef, useState } from "react";
import type { Day, Habit, Measurement, Photo, Question } from "../../db/schema";
import * as q from "../../db/queries";
import { newId } from "../../lib/id";
import { processPhoto } from "../../lib/image";

interface State {
  date: string;
  day: Day | null;
  habits: Habit[];
  done: Set<string>;
  notes: Record<string, string>;
  questions: Question[];
  answers: Record<string, string>;
  photos: Photo[];
  measurement: Measurement | null;
}

export function useDayData(date: string) {
  const [state, setState] = useState<State | null>(null);
  const dateRef = useRef(date);
  dateRef.current = date;
  const stateRef = useRef<State | null>(null);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await q.ensureSeeded();
      const [day, habits, logs, questions, answers, photos, measurement] = await Promise.all([
        q.getDay(date),
        q.listHabits(),
        q.getHabitLogs(date),
        q.listQuestions(),
        q.getAnswers(date),
        q.getPhotos(date),
        q.getMeasurement(date)
      ]);
      if (cancelled) return;
      setState({
        date,
        day: day ?? null,
        habits,
        done: new Set(logs.filter((l) => l.done).map((l) => l.habitId)),
        notes: Object.fromEntries(logs.filter((l) => l.note).map((l) => [l.habitId, l.note as string])),
        questions,
        answers: Object.fromEntries(answers.map((a) => [a.questionId, a.text])),
        photos,
        measurement: measurement ?? null
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const update = useCallback((fn: (s: State) => State) => {
    setState((s) => (s && s.date === dateRef.current ? fn(s) : s));
  }, []);

  /* ---- день ---- */
  const patch = useCallback(
    (d: string, p: Partial<Day>) => {
      if (d === dateRef.current) update((s) => ({ ...s, day: { ...(s.day ?? q.defaultDay(d)), ...p } }));
      return q.patchDay(d, p);
    },
    [update]
  );

  /* ---- привычки ---- */
  const toggleHabit = useCallback(
    (habitId: string) => {
      const s = stateRef.current;
      if (!s) return;
      const next = !s.done.has(habitId);
      update((st) => {
        const done = new Set(st.done);
        if (next) done.add(habitId);
        else done.delete(habitId);
        return { ...st, done };
      });
      q.setHabitLog(dateRef.current, habitId, next);
    },
    [update]
  );

  const setNote = useCallback(
    (d: string, habitId: string, note: string) => {
      if (d === dateRef.current) update((s) => ({ ...s, notes: { ...s.notes, [habitId]: note } }));
      return q.setHabitNote(d, habitId, note);
    },
    [update]
  );

  const addHabit = useCallback(
    async (title: string) => {
      const s = stateRef.current;
      const text = title.trim();
      if (!s || !text) return;
      const order = s.habits.length ? s.habits[s.habits.length - 1].order + 1 : 0;
      const h: Habit = { id: newId(), title: text, icon: "", order, archived: false, createdAt: Date.now() };
      await q.putHabit(h);
      update((st) => ({ ...st, habits: [...st.habits, h] }));
    },
    [update]
  );

  const renameHabit = useCallback(
    async (id: string, title: string) => {
      const h = stateRef.current?.habits.find((x) => x.id === id);
      if (!h) return;
      const next = { ...h, title };
      await q.putHabit(next);
      update((st) => ({ ...st, habits: st.habits.map((x) => (x.id === id ? next : x)) }));
    },
    [update]
  );

  // «Удаление» прячет привычку, а прошлые отметки остаются в данных
  const removeHabit = useCallback(
    async (id: string) => {
      const h = stateRef.current?.habits.find((x) => x.id === id);
      if (!h) return;
      await q.putHabit({ ...h, archived: true });
      update((st) => ({ ...st, habits: st.habits.filter((x) => x.id !== id) }));
    },
    [update]
  );

  const moveHabit = useCallback(
    async (id: string, dir: -1 | 1) => {
      const list = stateRef.current?.habits ?? [];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = { ...list[i], order: j };
      const b = { ...list[j], order: i };
      await Promise.all([q.putHabit(a), q.putHabit(b)]);
      update((st) => {
        const next = [...st.habits];
        next[i] = b;
        next[j] = a;
        return { ...st, habits: next };
      });
    },
    [update]
  );

  /* ---- вопросы ---- */
  const setAnswer = useCallback(
    (d: string, questionId: string, text: string) => {
      if (d === dateRef.current) update((s) => ({ ...s, answers: { ...s.answers, [questionId]: text } }));
      return q.putAnswer(d, questionId, text);
    },
    [update]
  );

  const addQuestion = useCallback(
    async (text: string) => {
      const s = stateRef.current;
      const t = text.trim();
      if (!s || !t) return;
      const order = s.questions.length ? s.questions[s.questions.length - 1].order + 1 : 0;
      const item: Question = { id: newId(), text: t, order, archived: false, showInLight: false };
      await q.putQuestion(item);
      update((st) => ({ ...st, questions: [...st.questions, item] }));
    },
    [update]
  );

  const changeQuestion = useCallback(
    async (id: string, change: Partial<Question>) => {
      const cur = stateRef.current?.questions.find((x) => x.id === id);
      if (!cur) return;
      const next = { ...cur, ...change };
      await q.putQuestion(next);
      update((st) => ({
        ...st,
        questions: st.questions.map((x) => (x.id === id ? next : x)).filter((x) => !x.archived)
      }));
    },
    [update]
  );

  const moveQuestion = useCallback(
    async (id: string, dir: -1 | 1) => {
      const list = stateRef.current?.questions ?? [];
      const i = list.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = { ...list[i], order: j };
      const b = { ...list[j], order: i };
      await Promise.all([q.putQuestion(a), q.putQuestion(b)]);
      update((st) => {
        const next = [...st.questions];
        next[i] = b;
        next[j] = a;
        return { ...st, questions: next };
      });
    },
    [update]
  );

  /* ---- фото ---- */
  const addPhotos = useCallback(
    async (files: File[], kind: Photo["kind"] = "snapshot") => {
      const d = dateRef.current;
      let hasCover = !!(await q.getDay(d))?.coverPhotoId;
      for (const file of files) {
        const processed = await processPhoto(file);
        const photo: Photo = { id: newId(), date: d, kind, ...processed, createdAt: Date.now() };
        await q.addPhoto(photo);
        update((s) => ({ ...s, photos: [...s.photos, photo] }));
        if (kind === "snapshot" && !hasCover) {
          hasCover = true;
          patch(d, { coverPhotoId: photo.id });
        }
      }
    },
    [update, patch]
  );

  const removePhoto = useCallback(
    async (id: string) => {
      const s = stateRef.current;
      if (!s) return;
      await q.deletePhoto(id);
      const rest = s.photos.filter((p) => p.id !== id && p.kind === "snapshot");
      update((st) => ({ ...st, photos: st.photos.filter((p) => p.id !== id) }));
      if (s.day?.coverPhotoId === id) patch(s.date, { coverPhotoId: rest.length ? rest[0].id : null });
    },
    [update, patch]
  );

  const setCover = useCallback((id: string) => patch(dateRef.current, { coverPhotoId: id }), [patch]);

  /* ---- вес и объёмы ---- */
  const saveMeasurement = useCallback(
    (d: string, p: Partial<Measurement>) => {
      if (d === dateRef.current) {
        update((s) => ({ ...s, measurement: { ...(s.measurement ?? { date: d }), ...p } }));
      }
      return q.patchMeasurement(d, p);
    },
    [update]
  );

  const allPhotos = state?.photos ?? [];

  return {
    ready: state !== null && state.date === date,
    day: state?.day ?? null,
    habits: state?.habits ?? [],
    done: state?.done ?? new Set<string>(),
    notes: state?.notes ?? {},
    questions: state?.questions ?? [],
    answers: state?.answers ?? {},
    photos: allPhotos.filter((p) => p.kind === "snapshot"),
    bodyPhotos: allPhotos.filter((p) => p.kind === "body"),
    measurement: state?.measurement ?? null,
    patch,
    setNote,
    toggleHabit,
    addHabit,
    renameHabit,
    removeHabit,
    moveHabit,
    setAnswer,
    addQuestion,
    changeQuestion,
    moveQuestion,
    addPhotos,
    removePhoto,
    setCover,
    saveMeasurement
  };
}
