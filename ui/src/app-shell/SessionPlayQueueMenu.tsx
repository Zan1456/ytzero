import { ListMusic, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { emit, emitToast } from "../events";
import { useI18n } from "../i18n";
import { clearSessionPlayQueue, removeFromSessionPlayQueue, sessionPlayQueueContext, useSessionPlayQueue } from "../sessionPlayQueue";
import { img } from "../img";
import { Badge, Button, EmptyState, FloatingPopover, IconButton, Input, List, ListRow } from "../components/ui";
import "./SessionPlayQueueMenu.css";

export default function SessionPlayQueueMenu() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const items = useSessionPlayQueue();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const play = () => {
    const context = sessionPlayQueueContext();
    if (!context) return;
    setOpen(false);
    navigate(`/watch/${context.ids[0]}`, { state: { playbackQueue: context } });
  };
  const save = async () => {
    if (!name.trim() || !items.length || saving) return;
    setSaving(true);
    try {
      await api.createUserPlaylistFromSessionQueue({ name: name.trim(), video_ids: items.map((item) => item.video_id) });
      setName("");
      emit("playlists-changed");
      emitToast(t("sessionQueueSaved"), "success");
    } catch { emitToast(t("sessionQueueSaveFailed"), "danger"); }
    finally { setSaving(false); }
  };
  const trigger = <Button variant="ghost" iconOnly className="session-queue-trigger" aria-label={t("sessionQueue")}><ListMusic />{items.length > 0 && <Badge size="sm" variant="accent" className="session-queue-count">{items.length}</Badge>}</Button>;
  return <FloatingPopover open={open} onOpenChange={setOpen} align="end" trigger={trigger}>
    <section className="session-queue-menu" aria-label={t("sessionQueue")}>
      <div className="session-queue-menu__head"><strong>{t("sessionQueue")}</strong>{items.length > 0 && <Button size="sm" onClick={play} leadingIcon={<Play size={15} />}>{t("sessionQueuePlay")}</Button>}</div>
      {items.length === 0 ? <EmptyState compact icon={<ListMusic />} title={t("sessionQueueEmpty")} /> : <>
        <List className="session-queue-menu__list">{items.map((item, index) => <ListRow key={item.video_id}
          media={item.thumbnail ? <img src={img(item.thumbnail)} alt="" /> : <span className="session-queue-menu__number">{index + 1}</span>}
          title={item.title || item.video_id} description={item.channel_title}
          actions={<IconButton size="sm" variant="ghost" label={t("sessionQueueRemove")} icon={<Trash2 size={15} />} onClick={() => removeFromSessionPlayQueue(item.video_id)} />}
        />)}</List>
        <div className="session-queue-menu__save"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("name")} /><Button size="sm" disabled={!name.trim() || saving} onClick={save}>{t("sessionQueueSave")}</Button></div>
        <Button size="sm" variant="ghost" className="session-queue-menu__clear" onClick={clearSessionPlayQueue}>{t("sessionQueueClear")}</Button>
      </>}
    </section>
  </FloatingPopover>;
}
