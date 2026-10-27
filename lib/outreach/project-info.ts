import type { CatalogItem } from "./model"

export function projectDescription(item: CatalogItem): string {
  return [
    item.city,
    item.housingClass && `Класс жилья: ${item.housingClass}`,
    item.developer && `Застройщик: ${item.developer}`,
    item.group && `Группа компаний: ${item.group}`,
    item.description,
  ].filter(Boolean).join(". ") || "В парсере пока нет описания этого ЖК."
}

export function projectLinks(item: CatalogItem) {
  return [...new Set(item.links)].flatMap((href) => {
    try {
      const url = new URL(href)
      if (!["https:", "http:"].includes(url.protocol)) return []
      const isDomRf = url.hostname === new URL("https://наш.дом.рф").hostname
      const id = url.pathname.match(/\/(\d+)\/?$/)?.[1]
      return [{ href, label: isDomRf ? `ДОМ.РФ${id ? ` · ${id}` : ""}` : "Сайт проекта" }]
    } catch { return [] }
  })
}
