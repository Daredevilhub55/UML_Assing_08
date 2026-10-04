export const sampleDiagram = {
  classes: [
    { id: "person", name: "Person", type: "class", x: 80, y: 100, attributes: [{ id: "a1", name: "name", type: "String", visibility: "private" }, { id: "a2", name: "age", type: "int", visibility: "private" }], methods: [{ id: "m1", name: "getName", returnType: "String", visibility: "public", parameters: [] }, { id: "m2", name: "getAge", returnType: "int", visibility: "public", parameters: [] }] },
    { id: "student", name: "Student", type: "class", x: 390, y: 55, attributes: [{ id: "a3", name: "rollNo", type: "int", visibility: "private" }, { id: "a4", name: "branch", type: "String", visibility: "private" }], methods: [{ id: "m3", name: "enroll", returnType: "void", visibility: "public", parameters: [] }] },
    { id: "teacher", name: "Teacher", type: "class", x: 390, y: 350, attributes: [{ id: "a5", name: "department", type: "String", visibility: "private" }], methods: [{ id: "m4", name: "teach", returnType: "void", visibility: "public", parameters: [] }] },
    { id: "course", name: "Course", type: "class", x: 740, y: 110, attributes: [{ id: "a6", name: "title", type: "String", visibility: "private" }], methods: [{ id: "m5", name: "getTitle", returnType: "String", visibility: "public", parameters: [] }] },
    { id: "department", name: "Department", type: "class", x: 740, y: 390, attributes: [{ id: "a7", name: "name", type: "String", visibility: "private" }], methods: [] },
  ],
  relationships: [
    { id: "r1", type: "inheritance", source: "student", target: "person", label: "" },
    { id: "r2", type: "inheritance", source: "teacher", target: "person", label: "" },
    { id: "r3", type: "association", source: "student", target: "course", label: "enrolls", sourceMultiplicity: "1", targetMultiplicity: "*" },
    { id: "r4", type: "association", source: "teacher", target: "course", label: "teaches", sourceMultiplicity: "1", targetMultiplicity: "*" },
    { id: "r5", type: "dependency", source: "course", target: "department", label: "" },
  ],
};
