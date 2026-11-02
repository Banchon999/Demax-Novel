import { describe, expect, it } from "vitest";
import { mapDraftToFields } from "@/lib/ai/entity-map";
import type { EntityType } from "@/lib/db/schema";

const type: EntityType = {
  id: "t", projectId: "p", name: "ตัวละคร", icon: "👤", color: "#fff", order: 1,
  fields: [
    { id: "role", label: "บทบาท", kind: "text" },
    { id: "power", label: "ความสามารถ/พลัง", kind: "longtext" },
  ],
};

describe("mapDraftToFields", () => {
  it("matches labels loosely and keeps unknown fields in notes", () => {
    const { fields, notes } = mapDraftToFields(
      {
        name: "เรน", aliases: [], tags: [], notes: "ชอบกินขนม",
        fields: [
          { label: "บทบาท", value: "ตัวรอง" },
          { label: "ความสามารถ", value: "ควบคุมน้ำ" },
          { label: "สีโปรด", value: "ฟ้า" },
          { label: "บทบาท", value: "ซ้ำ" },
        ],
      },
      type,
    );
    expect(fields).toEqual({ role: "ตัวรอง", power: "ควบคุมน้ำ" });
    expect(notes).toBe("ชอบกินขนม\nสีโปรด: ฟ้า\nบทบาท: ซ้ำ");
  });
});
