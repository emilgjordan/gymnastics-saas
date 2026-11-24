# FIG Code of Points extraction

Regenerates `src/lib/server/cop/cop-2025-2028.json` (the Skill library) from the official
FIG PDFs. Requires Python 3 with `pdfplumber` (`pip install pdfplumber`) and `pdftotext`.

```sh
cd scripts/cop
curl -o en_1.1_-_MAG_Code_of_Points_2025-2028.pdf "https://www.gymnastics.sport/publicdir/rules/files/en_1.1%20-%20MAG%20Code%20of%20Points%202025-2028.pdf"
curl -o en_1.1_-_WAG_COP_2025-2028.pdf "https://www.gymnastics.sport/publicdir/rules/files/en_1.1%20-%20WAG%20COP%202025-2028.pdf"
python3 mag_extract.py && python3 wag_extract.py && python3 vault_extract.py
python3 build.py ../../src/lib/server/cop/cop-2025-2028.json
```

How values are derived:

- **MAG** (except vault): element tables have 6 columns; the value is taken from the element
  number's column (A–E), and the last column is F unless a G–J letter is printed in the cell.
- **WAG** (except vault): element numbers encode the value — in `X.YZZ` the middle digit(s) `Y`
  are 1 = A … 10 = J (e.g. `5.1002` is a J).
- **Vault**: the printed D-score. WAG vault values were cross-checked against the Code's vault
  summary table.

Page ranges are hard-coded for the 2025–2028 editions; check them if the PDFs are re-issued.
