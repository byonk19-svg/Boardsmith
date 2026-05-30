import { describe, expect, it } from "vitest";
import {
  boardsmithBuildModelSchema,
  parseBoardsmithBuildModel,
  validateBuildModelSemantics,
  type BoardsmithBuildModel,
} from "@/lib/build-model/build-model-schema";
import { buildModelFixtures, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";

describe("boardsmithBuildModelSchema", () => {
  it("validates all v1 fixtures", () => {
    for (const fixture of buildModelFixtures) {
      expect(() => parseBoardsmithBuildModel(fixture)).not.toThrow();
    }
  });

  it("requires stable snake_case ids for pieces", () => {
    const invalidModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      pieces: [
        {
          ...simpleShelfBuildModelFixture.pieces[0],
          id: "Shelf Board",
        },
      ],
    };

    expect(boardsmithBuildModelSchema.safeParse(invalidModel).success).toBe(false);
  });

  it("reports connections that reference missing pieces", () => {
    const invalidModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      connections: [
        {
          ...simpleShelfBuildModelFixture.connections[0],
          fromPieceId: "missing_piece",
        },
      ],
    };

    expect(validateBuildModelSemantics(invalidModel)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "connections.0.fromPieceId",
        }),
      ]),
    );
  });

  it("reports operations that reference missing pieces", () => {
    const invalidModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      operations: [
        {
          ...simpleShelfBuildModelFixture.operations[0],
          pieceIds: ["missing_piece"],
        },
      ],
    };

    expect(validateBuildModelSemantics(invalidModel)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "operations.0.pieceIds.0",
        }),
      ]),
    );
  });

  it("reports connections that reference missing hardware ids", () => {
    const invalidModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      connections: [
        {
          ...simpleShelfBuildModelFixture.connections[0],
          hardwareIds: ["missing_hardware"],
        },
      ],
    };

    expect(validateBuildModelSemantics(invalidModel)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "connections.0.hardwareIds.0",
        }),
      ]),
    );
  });

  it("rejects semantic reference errors in the strict parser", () => {
    const invalidModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      operations: [
        {
          ...simpleShelfBuildModelFixture.operations[0],
          pieceIds: ["missing_piece"],
        },
      ],
    };

    expect(() => parseBoardsmithBuildModel(invalidModel)).toThrow("operations.0.pieceIds.0");
  });
});
