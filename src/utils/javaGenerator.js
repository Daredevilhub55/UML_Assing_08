const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
export const isJavaIdentifier = (value) => identifier.test(value.trim());

const defaultReturn = (type) => {
  if (type === "void") return "";
  if (["byte", "short", "int", "long", "float", "double"].includes(type)) return "0";
  if (type === "boolean") return "false";
  return "null";
};

export function generateJava(classes, relationships) {
  return classes.map((umlClass) => {
    const parent = relationships.find((relationship) => relationship.type === "inheritance" && relationship.source === umlClass.id);
    const associations = relationships.filter((relationship) => relationship.type === "association" && relationship.source === umlClass.id);
    const dependencies = relationships.filter((relationship) => relationship.type === "dependency" && relationship.source === umlClass.id);
    const imports = associations.filter((relationship) => relationship.targetMultiplicity === "*").length > 0;
    const lines = [];
    if (imports) lines.push("import java.util.ArrayList;", "import java.util.List;", "");
    const parentClass = classes.find((candidate) => candidate.id === parent?.target);
    const extendsText = parentClass ? ` extends ${parentClass.name}` : "";
    lines.push(`public class ${umlClass.name}${extendsText} {`, "");
    umlClass.attributes.forEach((attribute) => {
      const visibility = attribute.visibility === "package" ? "" : `${attribute.visibility} `;
      const modifiers = `${attribute.isStatic ? "static " : ""}${attribute.isFinal ? "final " : ""}`;
      lines.push(`    ${visibility}${modifiers}${attribute.type || "Object"} ${attribute.name};`, "");
    });
    associations.forEach((relationship) => {
      const target = classes.find((candidate) => candidate.id === relationship.target);
      if (!target) return;
      if (relationship.targetMultiplicity === "*") {
        const fieldName = `${target.name.charAt(0).toLowerCase()}${target.name.slice(1)}s`;
        lines.push(`    private List<${target.name}> ${fieldName} = new ArrayList<>();`, "");
      } else {
        const fieldName = `${target.name.charAt(0).toLowerCase()}${target.name.slice(1)}`;
        lines.push(`    private ${target.name} ${fieldName};`, "");
      }
    });
    dependencies.forEach((relationship) => {
      const target = classes.find((candidate) => candidate.id === relationship.target);
      if (target) lines.push(`    // Depends on ${target.name}`, "");
    });
    umlClass.methods.forEach((method) => {
      const visibility = method.visibility === "package" ? "" : `${method.visibility} `;
      const modifiers = `${method.isStatic ? "static " : ""}${method.isAbstract ? "abstract " : ""}`;
      const params = method.parameters.map((parameter) => `${parameter.type} ${parameter.name}`).join(", ");
      if (method.isAbstract) {
        lines.push(`    ${visibility}${modifiers}${method.returnType || "void"} ${method.name}(${params});`, "");
      } else {
        lines.push(`    ${visibility}${modifiers}${method.returnType || "void"} ${method.name}(${params}) {`);
        const placeholder = defaultReturn(method.returnType || "void");
        if (placeholder) lines.push(`        return ${placeholder};`);
        lines.push("    }", "");
      }
    });
    while (lines[lines.length - 1] === "") lines.pop();
    lines.push("}");
    return { name: `${umlClass.name}.java`, code: lines.join("\n") };
  });
}
