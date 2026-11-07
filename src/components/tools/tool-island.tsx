import { getSiteData } from '@/lib/content/site-data';
import { isToolLive } from '@/lib/tools/logic';
import { ToolLoader } from './tool-loader';

/**
 * Renders the interactive part of a tool page in place of its ::tool{id}
 * marker. Every tool defined in content/_tools/ is rendered live. The tool's
 * own code loads only on its page (see ToolLoader).
 */
export function ToolIsland({ id }: { id: string }) {
  if (!isToolLive(id)) {
    return (
      <p role="note" className="panel panel-quiet">
        This tool is being reviewed by a clinician and will be available here soon.
      </p>
    );
  }
  return <ToolLoader id={id} liveUrls={[...getSiteData().knownPaths]} trackerLive={isToolLive('symptom-tracker')} />;
}
