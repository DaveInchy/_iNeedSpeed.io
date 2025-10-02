import { create } from 'zustand'

export const useSceneGraphStore = create((set) => ({
  nodes: [],
  refs: new Map(), // New: Map to store references to three.js objects
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  removeNode: (id) => set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) })),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
    })),
  setNodes: (newNodes) => set({ nodes: newNodes }),
  setRef: (id, ref) => set((state) => { // New: Function to set a ref
    const newRefs = new Map(state.refs);
    newRefs.set(id, ref);
    return { refs: newRefs };
  }),
  removeRef: (id) => set((state) => { // New: Function to remove a ref
    const newRefs = new Map(state.refs);
    newRefs.delete(id);
    return { refs: newRefs };
  }),
}));
