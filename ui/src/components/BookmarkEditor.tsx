import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Bookmark, LoaderCircle, Trash2 } from "lucide-react";
import { api, type Bookmark as SavedBookmark } from "../api";
import { emit } from "../events";
import { useI18n } from "../i18n";
import { formatBookmarkTime, parseBookmarkTime } from "../bookmarkTime";
import { Alert, Button, Field, FloatingPopover, FormActions, IconButton, Input, Textarea } from "./ui";
import "./BookmarkEditor.css";

export default function BookmarkEditor({ videoId, currentPlaybackSeconds, trigger }: { videoId: string; currentPlaybackSeconds: () => number; trigger?: ReactElement }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [timestamp, setTimestamp] = useState("0:00");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const apply = useCallback((saved: SavedBookmark[], useCurrent: boolean) => {
    setBookmarks(saved);
    setTimestamp(formatBookmarkTime(useCurrent ? currentPlaybackSeconds() : 0));
    setDescription("");
  }, [currentPlaybackSeconds]);

  const load = useCallback(async (useCurrent: boolean) => {
    setLoading(true);
    setError("");
    try {
      const result = await api.videoBookmark(videoId);
      apply(result.bookmarks, useCurrent);
    } catch {
      setError(t("bookmarkLoadError"));
    } finally {
      setLoading(false);
    }
  }, [apply, t, videoId]);

  useEffect(() => { void load(false); }, [load]);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) void load(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const position = parseBookmarkTime(timestamp);
    if (position == null) {
      setError(t("bookmarkTimestampError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await api.saveVideoBookmark(videoId, { position_seconds: position, description });
      setBookmarks((items) => [...items, result.bookmark].sort((a, b) => a.position_seconds - b.position_seconds));
      setTimestamp(formatBookmarkTime(currentPlaybackSeconds()));
      setDescription("");
      setOpen(false);
      emit("bookmarks-changed");
    } catch {
      setError(t("bookmarkSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (bookmarkId: string) => {
    setSaving(true);
    setError("");
    try {
      await api.removeBookmark(videoId, bookmarkId);
      setBookmarks((items) => items.filter((item) => item.id !== bookmarkId));
      emit("bookmarks-changed");
    } catch {
      setError(t("bookmarkRemoveError"));
    } finally {
      setSaving(false);
    }
  };

  return <FloatingPopover
    triggerClassName="bookmark-editor"
    align="end"
    open={open}
    onOpenChange={changeOpen}
    className="bookmark-editor__popover"
    trigger={trigger ?? <Button variant={bookmarks.length > 0 ? "secondary" : "default"} aria-pressed={bookmarks.length > 0} leadingIcon={<Bookmark fill={bookmarks.length > 0 ? "currentColor" : "none"} />}>{t("bookmarkAction")}</Button>}
  >
    <div role="dialog" aria-label={t("bookmarkAddTitle")}>
      <div className="bookmark-editor__title">{t("bookmarkAddTitle")}</div>
      {loading ? <div className="bookmark-editor__loading"><LoaderCircle className="spin" /> {t("loading")}</div> : <form className="bookmark-editor__form" onSubmit={save}>
      {bookmarks.length > 0 && <div className="bookmark-editor__list">{bookmarks.map((item) => <div key={item.id} className="bookmark-editor__item"><span><strong>{formatBookmarkTime(item.position_seconds)}</strong>{item.description && <><span className="bookmark-editor__separator">—</span>{item.description}</>}</span><IconButton label={t("remove")} disabled={saving} onClick={() => void remove(item.id)}><Trash2 /></IconButton></div>)}</div>}
      <Field label={t("bookmarkTimestampLabel")} hint={t("bookmarkTimestampHint")} htmlFor="bookmark-timestamp">
        <Input id="bookmark-timestamp" inputMode="numeric" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} placeholder="12:34" />
      </Field>
      <Field label={t("bookmarkDescriptionLabel")} hint={t("bookmarkDescriptionHint")} htmlFor="bookmark-description">
        <Textarea id="bookmark-description" rows={4} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("bookmarkDescriptionPlaceholder")} />
      </Field>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormActions align="end">
        <Button type="submit" variant="primary" disabled={saving}>{saving && <LoaderCircle className="spin" />}{t("bookmarkSave")}</Button>
      </FormActions>
      </form>}
    </div>
  </FloatingPopover>;
}
