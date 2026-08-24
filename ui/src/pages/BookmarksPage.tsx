import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Clock3, ExternalLink, LoaderCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api, type BookmarkVideo } from "../api";
import { formatBookmarkTime } from "../bookmarkTime";
import Popconfirm from "../components/Popconfirm";
import TagChip from "../components/TagChip";
import { VideoThumbnail } from "../components/VideoThumbnail";
import { EmptyState, IconButton, List, ListRow, PageHeader, SectionHeader, Tabs, Text } from "../components/ui";
import { appDayKey, formatAppDateTime, formatCalendarDay } from "../dateTime";
import { useI18n } from "../i18n";
import { useDocumentTitle } from "../useDocumentTitle";
import "./BookmarksPage.css";

type BookmarkGrouping = "day" | "month" | "tag" | "channel" | "video";
type BookmarkGroup = { key: string; label: string; bookmarks: BookmarkVideo[] };

export default function BookmarksPage() {
  const { t, locale, timeZone } = useI18n();
  useDocumentTitle(t("bookmarksTitle"));
  const [bookmarks, setBookmarks] = useState<BookmarkVideo[]>([]);
  const [grouping, setGrouping] = useState<BookmarkGrouping>("day");
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBookmarks((await api.bookmarks()).bookmarks);
    } catch {
      setError(t("bookmarksLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo<BookmarkGroup[]>(() => {
    const result = new Map<string, BookmarkGroup>();
    const add = (key: string, label: string, bookmark: BookmarkVideo) => {
      const group = result.get(key);
      if (group) group.bookmarks.push(bookmark);
      else result.set(key, { key, label, bookmarks: [bookmark] });
    };
    for (const bookmark of bookmarks) {
      if (grouping === "day") {
        const day = appDayKey(bookmark.bookmarked_at, timeZone);
        add(day, formatCalendarDay(day, locale, { day: "numeric", month: "long", year: "numeric" }), bookmark);
      } else if (grouping === "month") {
        const month = appDayKey(bookmark.bookmarked_at, timeZone).slice(0, 7);
        add(month, formatCalendarDay(`${month}-01`, locale, { month: "long", year: "numeric" }), bookmark);
      } else if (grouping === "channel") {
        add(bookmark.channel_id, bookmark.channel_title, bookmark);
      } else if (grouping === "video") {
        add(bookmark.video_id, bookmark.title, bookmark);
      } else {
        const channelTags = bookmark.tags.filter((tag) => tag.source === "channel");
        if (channelTags.length === 0) add("untagged", t("bookmarksUntagged"), bookmark);
        else for (const tag of channelTags) add(`tag:${tag.id}`, tag.name, bookmark);
      }
    }
    return [...result.values()];
  }, [bookmarks, grouping, locale, t, timeZone]);

  const remove = async (bookmark: BookmarkVideo) => {
    setRemoving(bookmark.video_id);
    try {
      await api.removeVideoBookmark(bookmark.video_id);
      setBookmarks((items) => items.filter((item) => item.video_id !== bookmark.video_id));
    } catch {
      setError(t("bookmarkRemoveError"));
    } finally {
      setRemoving(null);
    }
  };

  const groupingOptions = [
    { value: "day" as const, label: t("bookmarksGroupDay") },
    { value: "month" as const, label: t("bookmarksGroupMonth") },
    { value: "tag" as const, label: t("bookmarksGroupChannelTag") },
    { value: "channel" as const, label: t("bookmarksGroupChannel") },
    { value: "video" as const, label: t("bookmarksGroupVideo") },
  ];

  return <>
    <PageHeader title={t("bookmarksTitle")} description={t("bookmarksDescription")} icon={<Bookmark />} />
    <div className="bookmarks-toolbar">
      <Text as="span" size="sm" tone="secondary">{t("bookmarksGroupBy")}</Text>
      <Tabs value={grouping} options={groupingOptions} onChange={setGrouping} label={t("bookmarksGroupBy")} variant="subtle" />
    </div>
    {error && <div className="bookmarks-error">{error}</div>}
    {loading ? <div className="bookmarks-loading"><LoaderCircle className="spin" /> {t("loading")}</div> : bookmarks.length === 0 ? (
      <EmptyState icon={<Bookmark />} title={t("bookmarksEmpty")} description={t("bookmarksEmptyHint")} />
    ) : <div className="bookmark-groups">
      {groups.map((group) => <section key={group.key} className="bookmark-group">
        <SectionHeader title={group.label} description={t("bookmarksCount", { count: group.bookmarks.length })} />
        <List className="bookmark-list">
          {group.bookmarks.map((bookmark) => {
            const target = `/watch/${bookmark.video_id}?t=${Math.floor(bookmark.position_seconds)}`;
            return <ListRow
              key={`${group.key}:${bookmark.bookmark_id}`}
              className="bookmark-row"
              media={<Link to={target} className="bookmark-row__thumbnail" aria-label={t("bookmarkReturn")}><VideoThumbnail src={bookmark.thumbnail} watched={bookmark.watched === 1} variant="search"><span className="bookmark-row__timestamp"><Clock3 /> {formatBookmarkTime(bookmark.position_seconds)}</span></VideoThumbnail></Link>}
              title={<Link to={target}>{bookmark.title}</Link>}
              description={<><Link className="bookmark-row__channel" to={`/channel/${bookmark.channel_id}`}>{bookmark.channel_title}</Link><span>{formatAppDateTime(bookmark.bookmarked_at, locale, timeZone)}</span></>}
              meta={<Link className="bookmark-row__return" to={target}><ExternalLink /> {t("bookmarkReturnAt", { time: formatBookmarkTime(bookmark.position_seconds) })}</Link>}
              actions={<Popconfirm message={t("bookmarkRemoveConfirm")} onConfirm={() => void remove(bookmark)}><IconButton label={t("remove")} disabled={removing === bookmark.video_id}><Trash2 /></IconButton></Popconfirm>}
            >
              {bookmark.bookmark_description && <p className="bookmark-row__note">{bookmark.bookmark_description}</p>}
              {bookmark.tags.filter((tag) => tag.source === "channel").length > 0 && <div className="bookmark-row__tags">{bookmark.tags.filter((tag) => tag.source === "channel").map((tag) => <TagChip key={tag.id} tag={tag} />)}</div>}
            </ListRow>;
          })}
        </List>
      </section>)}
    </div>}
  </>;
}
