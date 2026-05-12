import { defineConfig } from 'vite';

const repositoryName = 'portfolio-site';
const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  // GitHub project Pages deploys at:
  // https://<username>.github.io/<repositoryName>/
  //
  // Local development and custom-domain production should use '/'.
  // The GitHub Actions workflow sets GITHUB_PAGES=true so the Pages build
  // gets the required '/portfolio-site/' asset base path.
  base: isGitHubPagesBuild ? `/${repositoryName}/` : '/',
  build: {
    chunkSizeWarningLimit: 750
  }
});
