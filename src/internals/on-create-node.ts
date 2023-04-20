import { GatsbyNode } from "gatsby";
import { pollyTypeName } from "./constants";

export const onCreateNode: GatsbyNode["onCreateNode"] = async (
  { actions: { createNode, createParentChildLink }, node, createNodeId },
  pluginOptions
) => {
  const isFileType = node.internal.type === "File";
  const isSsmlFile =
    node.sourceInstanceName === pluginOptions.ssmlFilesSourceInstanceName;
  if (!isFileType || !isSsmlFile) {
    return;
  }
  const pollyNode = {
    id: createNodeId(`${node.id} >> ${pollyTypeName}`),
    children: [],
    parent: node.id,
    internal: {
      contentDigest: `${node.internal.contentDigest}`,
      type: pollyTypeName,
    },
  };
  createNode(pollyNode);
  createParentChildLink({ parent: node, child: pollyNode });
};
