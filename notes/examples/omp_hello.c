#include "omp.h"
#include "stdio.h"

/// main thread routine
int main(int argc, char **argv) {
  (void)argc;
  (void)argv;

#pragma omp parallel
  printf("Hello world!\n");
}
