// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { parseBackup } from '../src/core/parser.js'

const sampleXml = `<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>
<smses count="3">
  <sms protocol="0" address="+1234567890" date="1513434824858" type="1" body="Hello" contact_name="Alice" read="1" date_sent="0" />
  <sms protocol="0" address="+1234567890" date="1513434900000" type="2" body="Hi back" contact_name="Alice" read="1" date_sent="1513434900000" />
  <mms date="1519579570000" msg_box="1" address="+9876543210" contact_name="Bob" text_only="0">
    <parts>
      <part seq="-1" ct="application/smil" text="&lt;smil&gt;" data="null" name="smil.xml" cl="smil.xml" />
      <part seq="0" ct="text/plain" text="Check this out" data="null" name="text.txt" cl="text.txt" />
      <part seq="1" ct="image/jpeg" text="null" data="abc123" name="photo.jpg" cl="photo.jpg" />
    </parts>
    <addrs>
      <addr address="+9876543210" type="137" charset="106" />
      <addr address="+1111111111" type="151" charset="106" />
    </addrs>
  </mms>
</smses>`

describe('parseBackup', () => {
  it('parses SMS elements', () => {
    const msgs = parseBackup(sampleXml)
    const sms = msgs[0]
    expect(sms.kind).toBe('sms')
    expect(sms.address).toBe('+1234567890')
    expect(sms.contactName).toBe('Alice')
    expect(sms.body).toBe('Hello')
    expect(sms.date).toBe(1513434824858)
    expect(sms.type).toBe(1)
    expect(sms.read).toBe(true)
  })

  it('parses outgoing SMS type=2', () => {
    const msgs = parseBackup(sampleXml)
    expect(msgs[1].type).toBe(2)
  })

  it('parses MMS with parts and addrs', () => {
    const msgs = parseBackup(sampleXml)
    const mms = msgs[2]
    expect(mms.kind).toBe('mms')
    expect(mms.address).toBe('+9876543210')
    expect(mms.msgBox).toBe(1)
    // SMIL part (seq=-1) should be skipped
    expect(mms.parts.length).toBe(2)
    expect(mms.parts[0].ct).toBe('text/plain')
    expect(mms.parts[0].text).toBe('Check this out')
    expect(mms.parts[1].ct).toBe('image/jpeg')
    expect(mms.parts[1].data).toBe('abc123')
    expect(mms.addrs.length).toBe(2)
    expect(mms.addrs[0].type).toBe(137)
    expect(mms.addrs[1].type).toBe(151)
  })

  it('throws on invalid XML root', () => {
    expect(() => parseBackup('<calls><call /></calls>')).toThrow('Not a valid SMS Backup')
  })

  it('treats literal "null" as empty string', () => {
    const xml = `<smses count="1"><sms address="123" date="0" type="1" body="null" contact_name="null" read="0" /></smses>`
    const [msg] = parseBackup(xml)
    expect(msg.body).toBe('')
    expect(msg.contactName).toBe('')
  })
})
