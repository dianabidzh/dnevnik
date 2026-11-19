import { requestPersistentStorage } from "../db/db";
import { useSettings } from "../settings/SettingsProvider";
import { isStandalone } from "../utils/pwa";
import { ThemePicker } from "./ThemePicker";

export function Welcome() {
  const { setOption } = useSettings();
  return (
    <div className="welcome" role="dialog" aria-modal="true" aria-label="Добро пожаловать">
      <div className="welcome-inner">
        <h1>Ваш ежедневник</h1>
        <p>
          Личные страницы, на которых можно отмечать состояние, привычки и мысли. Всё остаётся только на этом телефоне.
        </p>

        <h3>Выберите оформление</h3>
        <ThemePicker />

        {!isStandalone() && (
          <p className="small welcome-tip">
            Важно: чтобы iPhone не стёр записи, добавьте приложение на экран «Домой». Нажмите «Поделиться» в Safari и выберите «На экран “Домой”».
          </p>
        )}

        <button
          className="btn welcome-go"
          onClick={() => {
            requestPersistentStorage();
            setOption("welcomed", true);
          }}
        >
          Начать
        </button>
      </div>
    </div>
  );
}
