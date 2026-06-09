/** Pure read/unread helpers shared by API routes and client UI. */

export function isOwnCollaborationContent(
  viewerUserId: string | null | undefined,
  authorUserId: string,
): boolean {
  return Boolean(viewerUserId && viewerUserId === authorUserId);
}

export function isCollaborationItemRead(
  activityAt: string,
  lastReadAt: string | null | undefined,
  readOverride?: boolean | null,
): boolean {
  if (readOverride !== null && readOverride !== undefined) {
    return readOverride;
  }
  if (!lastReadAt) return false;
  return new Date(activityAt).getTime() <= new Date(lastReadAt).getTime();
}

export function isCollaborationItemReadForViewer(
  viewerUserId: string | null | undefined,
  authorUserId: string,
  activityAt: string,
  lastReadAt: string | null | undefined,
  readOverride?: boolean | null,
): boolean {
  if (isOwnCollaborationContent(viewerUserId, authorUserId)) {
    return true;
  }
  return isCollaborationItemRead(activityAt, lastReadAt, readOverride);
}

export function isCollaborationItemUnreadForViewer(
  viewerUserId: string | null | undefined,
  authorUserId: string,
  activityAt: string,
  lastReadAt: string | null | undefined,
  readOverride?: boolean | null,
  isHidden = false,
): boolean {
  if (isHidden) return false;
  return !isCollaborationItemReadForViewer(
    viewerUserId,
    authorUserId,
    activityAt,
    lastReadAt,
    readOverride,
  );
}
