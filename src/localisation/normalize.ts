/**
 * The comparison key for a name: compatibility forms folded (full-width letters, ligatures), typographic quotes and
 * dashes made plain, whitespace collapsed, space before French punctuation dropped, and case folded without a locale.
 */
export function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201B\u02BC`\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/ (?=[:;!?])/g, "")
    .trim()
    .toLowerCase();
}

/**
 * The normalized key with accents removed from Latin, Greek and Cyrillic letters, for lists typed without them. Marks in
 * other scripts stay, since a Japanese voicing mark makes a different word rather than an accented one.
 */
export function foldName(name: string): string {
  return normalizeName(name)
    .normalize("NFD")
    .replace(/([\p{Script=Latin}\p{Script=Greek}\p{Script=Cyrillic}])\p{M}+/gu, "$1")
    .normalize("NFC");
}
