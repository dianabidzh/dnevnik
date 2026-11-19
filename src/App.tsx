import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TabBar } from "./components/TabBar";
import { Welcome } from "./components/Welcome";
import { BodyReport } from "./screens/BodyReport";
import { BookPage } from "./screens/BookPage";
import { Books } from "./screens/Books";
import { Day } from "./screens/Day";
import { Export } from "./screens/Export";
import { Habits } from "./screens/Habits";
import { Library } from "./screens/Library";
import { LibraryFolder } from "./screens/LibraryFolder";
import { LibraryMaterial } from "./screens/LibraryMaterial";
import { Month } from "./screens/Month";
import { More } from "./screens/More";
import { Today } from "./screens/Today";
import { SettingsProvider, useSettings } from "./settings/SettingsProvider";
import { ThemeProvider } from "./theme/ThemeProvider";

function Shell() {
  const { ready, options } = useSettings();
  if (!ready) return null;
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/month" element={<Month />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/more" element={<More />} />
          <Route path="/export" element={<Export />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookPage />} />
          <Route path="/body" element={<BodyReport />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/:folderId" element={<LibraryFolder />} />
          <Route path="/library/:folderId/:materialId" element={<LibraryMaterial />} />
          <Route path="/day/:date" element={<Day />} />
        </Routes>
        <TabBar />
      </div>
      {!options.welcomed && <Welcome />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    </ThemeProvider>
  );
}
