export function getDeletedForMe() {
  return JSON.parse(localStorage.getItem("deletedForMe") || "[]");
}

export function addDeletedForMe(id) {
  const deleted = getDeletedForMe();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem("deletedForMe", JSON.stringify(deleted));
  }
}