import succession from "./succession.json";

export default function handler(req, res) {
  res.status(200).json(succession);
}
