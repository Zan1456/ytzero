import { Headphones, Play, SkipForward } from "lucide-react";
import type { Video } from "../api";
import { rememberProfileAudioMode } from "../audioModePreference";
import { useI18n } from "../i18n";
import { playlistContinueTarget } from "../playlistPlayback";
import { rememberedProfileId } from "../profilePreference";
import { MenuItem, SplitButton } from "./ui";

export function playPlaylistVideo(video: Video, audioOnly: boolean, onPlay: (video: Video) => void): void {
  rememberProfileAudioMode(rememberedProfileId(), audioOnly);
  onPlay(video);
}

export default function PlaylistPlaybackActions({ videos, disabled = false, onPlay }: {
  videos: readonly Video[];
  disabled?: boolean;
  onPlay: (video: Video) => void;
}) {
  const { t } = useI18n();
  const first = videos[0];
  const continuation = playlistContinueTarget(videos);
  if (!first) return null;

  return <>
    {continuation && (
      <SplitButton
        variant="primary"
        disabled={disabled}
        leadingIcon={<SkipForward />}
        onClick={() => playPlaylistVideo(continuation, false, onPlay)}
        menuLabel={t("moreActions")}
        menu={<MenuItem disabled={disabled} icon={<Headphones />} onClick={() => playPlaylistVideo(continuation, true, onPlay)}>{t("continueWatchingAudioOnly")}</MenuItem>}
      >
        {t("continueWatching")}
      </SplitButton>
    )}
    <SplitButton
      variant={continuation ? "default" : "primary"}
      disabled={disabled}
      leadingIcon={<Play />}
      onClick={() => playPlaylistVideo(first, false, onPlay)}
      menuLabel={t("moreActions")}
      menu={<MenuItem disabled={disabled} icon={<Headphones />} onClick={() => playPlaylistVideo(first, true, onPlay)}>{t("playlistPlayAllAudioOnly")}</MenuItem>}
    >
      {t("playlistPlayAll")}
    </SplitButton>
  </>;
}
