import { useState } from "react";
import { Link } from "react-router-dom";
import { BlobImage } from "../../components/BlobImage";
import { ManageList } from "../../components/ManageList";
import { Sheet } from "../../components/Sheet";
import { defaultDay, eventOnDate } from "../../db/queries";
import type { CalEvent } from "../../db/schema";
import { useSettings } from "../../settings/SettingsProvider";
import { formatDayLong, greeting, shiftDay, todayISO } from "../../utils/dates";
import { BackupBanner } from "../backup/BackupBanner";
import { EventSheet } from "../events/EventSheet";
import { EventsBlock } from "../events/EventsBlock";
import { useEvents } from "../events/useEvents";
import { BodyBlock } from "./BodyBlock";
import { HabitsBlock } from "./HabitsBlock";
import { PhotoBlock } from "./PhotoBlock";
import { QuestionsBlock } from "./QuestionsBlock";
import { QuoteOfDay } from "./QuoteOfDay";
import { ReadingBlock } from "./ReadingBlock";
import { ScoreBlock } from "./ScoreBlock";
import { ThoughtsBlock } from "./ThoughtsBlock";
import { useDayData } from "./useDayData";
import "./day.css";

function dayLink(iso: string): string {
  return iso === todayISO() ? "/" : "/day/" + iso;
}

export function DayPage({ date }: { date: string }) {
  const data = useDayData(date);
  const { options } = useSettings();
  const { events, reload } = useEvents();
  const [sheet, setSheet] = useState<"habits" | "questions" | null>(null);
  const [eventSheet, setEventSheet] = useState<{ event: CalEvent | null } | null>(null);
  const isToday = date === todayISO();
  const day = data.day ?? defaultDay(date);
  const cover = day.coverPhotoId ? data.photos.find((p) => p.id === day.coverPhotoId) : undefined;
  const dayEvents = events.filter((e) => eventOnDate(e, date));

  const header = (
    <header className="page-head">
      <div className="day-nav">
        <Link to={dayLink(shiftDay(date, -1))} aria-label="Предыдущий день" className="nav-arrow">
          ‹
        </Link>
        {isToday ? (
          <span className="kicker">{greeting()}</span>
        ) : (
          <Link to="/month" className="kicker back-link">
            К месяцу
          </Link>
        )}
        {isToday ? (
          <span className="nav-arrow off" aria-hidden="true">
            ›
          </span>
        ) : (
          <Link to={dayLink(shiftDay(date, 1))} aria-label="Следующий день" className="nav-arrow">
            ›
          </Link>
        )}
      </div>
      <h1>{formatDayLong(date)}</h1>
    </header>
  );

  if (!data.ready) return <main className="page">{header}</main>;

  return (
    <main className="page" key={date}>
      {header}

      <QuoteOfDay date={date} />

      <EventsBlock events={dayEvents} onAdd={() => setEventSheet({ event: null })} onEdit={(e) => setEventSheet({ event: e })} />

      {isToday && <BackupBanner />}

      {cover && (
        <figure className="polaroid">
          <BlobImage blob={cover.blob} alt="Обложка дня" />
        </figure>
      )}

      <ScoreBlock
        title="Утреннее состояние"
        hint="Как вы себя чувствуете сейчас?"
        value={day.morningMood}
        lowLabel="тяжело"
        highLabel="прекрасно"
        onChange={(v) => data.patch(date, { morningMood: v })}
      />
      <ScoreBlock
        title="Качество сна"
        hint="Как вы спали этой ночью?"
        value={day.sleepQuality}
        lowLabel="плохо"
        highLabel="отлично"
        onChange={(v) => data.patch(date, { sleepQuality: v })}
      />
      <HabitsBlock
        date={date}
        habits={data.habits}
        done={data.done}
        notes={data.notes}
        onToggle={data.toggleHabit}
        onNote={data.setNote}
        onManage={() => setSheet("habits")}
      />
      <ScoreBlock
        title="Вечернее состояние"
        hint="Как вы себя чувствуете к вечеру?"
        value={day.eveningMood}
        lowLabel="тяжело"
        highLabel="прекрасно"
        onChange={(v) => data.patch(date, { eveningMood: v })}
      />

      <ReadingBlock date={date} />

      <QuestionsBlock
        date={date}
        questions={data.questions}
        answers={data.answers}
        onSave={data.setAnswer}
        onManage={() => setSheet("questions")}
      />

      <ThoughtsBlock date={date} initial={day.thoughts} onSave={(d, t) => data.patch(d, { thoughts: t })} />

      <PhotoBlock
        title="Снимок дня"
        hint="Одно или несколько фото. Одно из них можно сделать обложкой дня."
        allowCover
        photos={data.photos}
        coverId={day.coverPhotoId}
        onAdd={(files) => data.addPhotos(files, "snapshot")}
        onSetCover={data.setCover}
        onRemove={data.removePhoto}
      />

      {(options.trackWeight || options.trackMeasurements) && (
        <BodyBlock
          date={date}
          measurement={data.measurement}
          showWeight={options.trackWeight}
          showMeasurements={options.trackMeasurements}
          onSave={data.saveMeasurement}
        />
      )}

      {options.extraPhotos && (
        <PhotoBlock
          title="Дополнительные фото"
          hint="Для вашего личного архива. Хранятся только на этом телефоне."
          allowCover={false}
          photos={data.bodyPhotos}
          coverId={null}
          onAdd={(files) => data.addPhotos(files, "body")}
          onSetCover={data.setCover}
          onRemove={data.removePhoto}
        />
      )}

      <EventSheet
        open={eventSheet !== null}
        event={eventSheet?.event ?? null}
        defaultDate={date}
        onClose={() => setEventSheet(null)}
        onChanged={reload}
      />

      <Sheet open={sheet === "habits"} title="Мои привычки" onClose={() => setSheet(null)}>
        <ManageList
          items={data.habits.map((h) => ({ id: h.id, text: h.title }))}
          placeholder="Новая привычка"
          empty="Привычек пока нет."
          onAdd={data.addHabit}
          onRename={data.renameHabit}
          onMove={data.moveHabit}
          onRemove={(id) => {
            const h = data.habits.find((x) => x.id === id);
            if (h && window.confirm("Убрать привычку «" + h.title + "»? Прошлые отметки сохранятся в ваших данных.")) {
              data.removeHabit(id);
            }
          }}
        />
      </Sheet>

      <Sheet open={sheet === "questions"} title="Мои вопросы" onClose={() => setSheet(null)}>
        <ManageList
          items={data.questions.map((q) => ({ id: q.id, text: q.text }))}
          placeholder="Новый вопрос"
          empty="Вопросов пока нет."
          onAdd={data.addQuestion}
          onRename={(id, text) => data.changeQuestion(id, { text })}
          onMove={data.moveQuestion}
          onRemove={(id) => {
            const q = data.questions.find((x) => x.id === id);
            if (q && window.confirm("Убрать вопрос «" + q.text + "»? Прошлые ответы сохранятся в ваших данных.")) {
              data.changeQuestion(id, { archived: true });
            }
          }}
        />
      </Sheet>
    </main>
  );
}
