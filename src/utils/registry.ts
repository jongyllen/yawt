import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegistryEntry {
    id: string;
    name: string;
    description: string;
    author: string;
    path: string; // Relative path to the JSON file in the repo
}

export interface RegistryManifest {
    programs: RegistryEntry[];
}

const DEFAULT_REPO = 'jongyllen/yawt-workouts';
const DEFAULT_BRANCH = 'main';

export async function fetchRegistry(): Promise<RegistryManifest | null> {
    const repo = await AsyncStorage.getItem('registry_repo') || DEFAULT_REPO;
    const branch = await AsyncStorage.getItem('registry_branch') || DEFAULT_BRANCH;

    const url = `https://raw.githubusercontent.com/${repo}/${branch}/registry.json`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch registry: ${response.status}`);
        }
        const data = await response.json();
        return data as RegistryManifest;
    } catch (error) {
        console.error('Error fetching registry:', error);
        return null;
    }
}

export async function fetchRemoteProgram(path: string): Promise<any | null> {
    const repo = await AsyncStorage.getItem('registry_repo') || DEFAULT_REPO;
    const branch = await AsyncStorage.getItem('registry_branch') || DEFAULT_BRANCH;

    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch program: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching remote program:', error);
        return null;
    }
}
