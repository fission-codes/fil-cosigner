{ sources ? import ./nix/sources.nix, pkgs ? import sources.nixpkgs { } }:

let
  yarn = pkgs.yarn.overrides { nodejs = pkgs.nodejs-16_x; };

  package = pkgs.lib.importJSON ./package.json;
  name = package.name;
in pkgs.mkYarnPackage {
  src = ./.;
  doDist = false;
  dontStrip = true;

  packageJSON = ./package.json;
  yarnLock = ./yarn.lock;
  yarnNix = ./nix/yarn.nix;

  buildPhase = ''
    export HOME=$(mktemp -d)
    yarn --offline build
  '';

  # doDist is apparently broken in mkYarnPackage
  distPhase = ''
    true
  '';

  postInstall = ''
    makeWrapper ${pkgs.nodejs-16_x}/bin/node "$out/bin/${name}" \
      --add-flags "$out/libexec/${name}/deps/${name}/dist/index.js"
  '';

  nativeBuildInputs = with pkgs; [ makeWrapper ];
}
