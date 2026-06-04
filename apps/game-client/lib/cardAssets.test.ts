import assert from "node:assert/strict";
import {
  CARD_ASSET_PATHS,
  CARD_BACK_IMAGE_SRC,
  CARD_FACE_VALUES,
  getCardFaceImageSrc,
  getCardImageSrc,
  isCardFaceValue,
} from "./cardAssets";

assert.deepEqual(CARD_FACE_VALUES, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
assert.equal(CARD_BACK_IMAGE_SRC, "/cards/trio_back_card.webp");
assert.equal(CARD_ASSET_PATHS.length, 13);

for (const value of CARD_FACE_VALUES) {
  assert.equal(isCardFaceValue(value), true);
  assert.equal(getCardFaceImageSrc(value), `/cards/card_${value}.webp`);
  assert.equal(getCardImageSrc(value), `/cards/card_${value}.webp`);
}

assert.equal(isCardFaceValue(0), false);
assert.equal(isCardFaceValue(13), false);
assert.equal(getCardImageSrc(0), CARD_BACK_IMAGE_SRC);
assert.equal(getCardImageSrc(99), CARD_BACK_IMAGE_SRC);
