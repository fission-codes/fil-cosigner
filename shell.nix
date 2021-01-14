{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs
    pkgs.yarn

    pkgs.nodePackages.npm
    pkgs.nodePackages.yo

    # keep this line if you use bash
    pkgs.bashInteractive
  ];
}
