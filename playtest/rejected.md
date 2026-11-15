# Changes the judge turned down

## 1115d-r01 — polish

- R1115d-r01-06 (shared budget label and 8-second note): the note named the wrong station, e.g. a Procurement priority-delivery fee showed as "SHARED · COMMS -0.1 M" on Procurement's own header, because any spend that was not a new contract, funding or Science fell through to Comms; Comms also still could not see what the parts will cost. Next attempt: take the station from the action type that moved the money, show nothing when it is unknown, put "parts ≈ x M" where Comms can read it, and keep the "Shared budget" label.
