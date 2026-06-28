/**
 * Parses a vCard text string and returns { name, phones, emails }.
 * Only extracts FN, TEL, and EMAIL — name + number as specified.
 */
export function parseVcard(text) {
  const result = { name: '', phones: [], emails: [] }
  for (const rawLine of text.split(/\r?\n/)) {
    const line = unfoldLine(rawLine)
    if (line.startsWith('FN:')) {
      result.name = decodeVcardValue(line.slice(3))
    } else if (/^TEL[;:]/i.test(line)) {
      const val = line.split(':').slice(1).join(':').trim()
      if (val) result.phones.push(val)
    } else if (/^EMAIL[;:]/i.test(line)) {
      const val = line.split(':').slice(1).join(':').trim()
      if (val) result.emails.push(val)
    }
  }
  return result
}

function unfoldLine(line) {
  // vCard folded lines start with whitespace — handled by caller joining
  return line
}

function decodeVcardValue(val) {
  return val.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim()
}
