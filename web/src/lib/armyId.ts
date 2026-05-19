export function makeArmyId(faction: string, spearheadName: string): string {
  return `${faction}::${spearheadName}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function armySearchText(army: {
  faction: string
  spearheadName: string
  grandAlliance: string
  details: string
  quickRulesFileName: string | null
}): string {
  return [
    army.faction,
    army.spearheadName,
    army.grandAlliance,
    army.details,
    army.quickRulesFileName ?? '',
  ]
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
