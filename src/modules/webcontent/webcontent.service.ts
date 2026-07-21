import { pool } from "../../config/db";
import { RowDataPacket } from "mysql2";

interface Section {
  label: string;
  visible: boolean;
}

function toWebContent(row: RowDataPacket) {
  return {
    headline: row.headline,
    sections: typeof row.sections === "string" ? JSON.parse(row.sections) : row.sections,
  };
}

export async function getWebContent() {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM web_content WHERE id = 1");
  if (rows.length === 0) {
    await pool.query("INSERT INTO web_content (id, headline, sections) VALUES (1, '', JSON_ARRAY())");
    return { headline: "", sections: [] as Section[] };
  }
  return toWebContent(rows[0]);
}

export async function updateWebContent(input: { headline?: string; sections?: Section[] }) {
  const current = await getWebContent();
  const headline = input.headline ?? current.headline;
  const sections = input.sections ?? current.sections;

  await pool.query(
    "UPDATE web_content SET headline = ?, sections = ? WHERE id = 1",
    [headline, JSON.stringify(sections)]
  );

  return { headline, sections };
}
