import { describe, expect, it } from 'vitest';
import { outboundTable } from '../../src/lib/analytics/outbound';
import { getProfile } from '../../src/lib/content';
import { MACHINE_LEAKS } from '../helpers/machine-leaks';

describe('WhatsApp contact', () => {
  it('is on the profile as wa.me with a prefilled message', async () => {
    const whatsapp = (await getProfile()).contacts.find((contact) => contact.kind === 'whatsapp');
    expect(whatsapp?.value).toMatch(/^https:\/\/wa\.me\/5511917493331\?text=/);
  });

  it('resolves through /go so the click is measured', async () => {
    const table = outboundTable({ contacts: (await getProfile()).contacts, projects: [] });
    expect(table.get('/go/contato/whatsapp')).toMatch(/^https:\/\/wa\.me\/5511917493331/);
  });

  it('makes the machine-route leak gate catch the number', () => {
    const caught = MACHINE_LEAKS.some(([, pattern]) => pattern.test('https://wa.me/5511917493331'));
    expect(caught).toBe(true);
  });
});
