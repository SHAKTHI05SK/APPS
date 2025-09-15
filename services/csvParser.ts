
export function parseCSV<T extends object>(csvText: string, headersOverride?: string[]): T[] {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length === 0) return [];

  const headers = headersOverride || lines[0].split(',').map(header => header.trim());
  const dataLines = headersOverride ? lines : lines.slice(1);

  return dataLines.map(line => {
    const values = line.split(',');
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return entry as T;
  }).filter(entry => Object.values(entry).some(val => val !== '')); // Filter out completely empty rows potentially caused by trailing newlines
}
