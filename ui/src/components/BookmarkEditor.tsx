import { useCallback, useEffect, useState } from "react";
import { Bookmark, LoaderCircle, Trash2 } from "lucide-react";
import { api, type Bookmark as SavedBookmark } from "../api";
import { emit } from "../events";
import { useI18n } from "../i18n";
import { formatBookmarkTime, parseBookmarkTime } from "../bookmarkTime";
import { Alert, Button, Field, FloatingPopover, FormActions, Input, Textarea } from "./ui";
import "./BookmarkEditor.css";

export default function BookmarkEditor({ videoId, currentPlaybackSeconds }: { videoId: string; currentPlaybackSeconds: () => number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [bookmark, setBookmark] = useState<SavedBookmark | null>(null);
  const [timestamp, setTimestamp] = useState("0:00");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const apply = useCallback((saved: SavedBookmark | null, useCurrent: boolean) => {
    setBookmark(saved);
    setTimestamp(formatBookmarkTime(saved?.position_seconds ?? (useCurrent ? currentPlaybackSeconds() : 0)));
    setDescription(saved?.description ?? "");
  }, [currentPlaybackSeconds]);

  const load = useCallback(async (useCurrent: boolean) => {
    setLoading(true);
    setError("");
    try {
      const result = await api.videoBookmark(videoId);
      apply(result.bookmark, useCurrent);
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
      apply(result.bookmark, false);
      setOpen(false);
      emit("bookmarks-changed");
    } catch {
      setError(t("bookmarkSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError("");
    try {
      await api.removeVideoBookmark(videoId);
      apply(null, true);
      setOpen(false);
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
    trigger={<Button variant={bookmark ? "secondary" : "default"} aria-pressed={Boolean(bookmark)} leadingIcon={<Bookmark fill={bookmark ? "currentColor" : "none"} />}>{t("bookmarkAction")}</Button>}
  >
    <div role="dialog" aria-label={bookmark ? t("bookmarkEditTitle") : t("bookmarkAddTitle")}>
      <div className="bookmark-editor__title">{bookmark ? t("bookmarkEditTitle") : t("bookmarkAddTitle")}</div>
      {loading ? <div className="bookmark-editor__loading"><LoaderCircle className="spin" /> {t("loading")}</div> : <form className="bookmark-editor__form" onSubmit={save}>
      <Field label={t("bookmarkTimestampLabel")} hint={t("bookmarkTimestampHint")} htmlFor="bookmark-timestamp">
        <Input id="bookmark-timestamp" inputMode="numeric" value={timestamp} onChange={(event) => setTimestamp(event.target.value)} placeholder="12:34" />
      </Field>
      <Field label={t("bookmarkDescriptionLabel")} hint={t("bookmarkDescriptionHint")} htmlFor="bookmark-description">
        <Textarea id="bookmark-description" rows={4} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("bookmarkDescriptionPlaceholder")} />
      </Field>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormActions align={bookmark ? "between" : "end"}>
        {bookmark && <Button variant="danger" leadingIcon={<Trash2 />} disabled={saving} onClick={() => void remove()}>{t("remove")}</Button>}
        <Button type="submit" variant="primary" disabled={saving}>{saving && <LoaderCircle className="spin" />}{bookmark ? t("bookmarkUpdate") : t("bookmarkSave")}</Button>
      </FormActions>
      </form>}
    </div>
  </FloatingPopover>;
}
