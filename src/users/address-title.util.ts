interface AddressTitleRecord {
  title?: string | null;
}

export function normalizeAddressTitle(title?: string | null) {
  return (title || '').trim().replace(/\s+/g, ' ');
}

export function addressTitleKey(title?: string | null) {
  return normalizeAddressTitle(title).toLowerCase();
}

export function ensureUniqueAddressTitles(addresses: AddressTitleRecord[]) {
  const usedTitles = new Set<string>();
  let changed = false;

  addresses.forEach((address, index) => {
    const originalTitle = normalizeAddressTitle(address.title) || `نشانی ${index + 1}`;
    let title = originalTitle;
    let suffix = 2;
    while (usedTitles.has(addressTitleKey(title))) {
      title = `${originalTitle} (${suffix++})`;
    }

    if (address.title !== title) {
      address.title = title;
      changed = true;
    }
    usedTitles.add(addressTitleKey(title));
  });

  return changed;
}
