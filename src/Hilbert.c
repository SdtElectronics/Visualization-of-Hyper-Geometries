#include <emscripten/emscripten.h>
#include <stdlib.h>
/*
static inline uint32_t rotl32 (uint32_t n, unsigned int c)
{
  const unsigned int mask = (CHAR_BIT*sizeof(n) - 1);  // assumes width is a power of 2.

  // assert ( (c<=mask) &&"rotate by type width or more");
  c &= mask;
  return (n<<c) | (n>>( (-c)&mask ));
}

static inline uint32_t rotr32 (uint32_t n, unsigned int c)
{
  const unsigned int mask = (CHAR_BIT*sizeof(n) - 1);

  // assert ( (c<=mask) &&"rotate by type width or more");
  c &= mask;
  return (n>>c) | (n<<( (-c)&mask ));
}
*/
void EMSCRIPTEN_KEEPALIVE InttoTranspose(const int dim, const long long int h, int * x){
  int idir, ibit, ifbit;

  for(idir = 0; idir < dim; idir++) x[idir] = 0;
  
  ifbit = 0;
  for(ibit = 0; ibit < 21; ibit++){
    for(idir = dim - 1; idir >= 0; idir--){
      x[idir] += (((h>>ifbit)&1)<<ibit);
      ifbit++;
    }
  }
  
}


void EMSCRIPTEN_KEEPALIVE TransposetoAxes(int* X, int b, int n ){ /* position, #bits, dimension */

  int N = 2 << (b-1), P, Q, t;
  int i;

  /* Gray decode by H ^ (H/2) */
  t = X[n-1] >> 1;
  for(i = n - 1; i > 0; i--) X[i] ^= X[i-1];
  X[0] ^= t;

  /* Undo excess work */
  for( Q = 2; Q != N; Q <<= 1 ) {
    P = Q - 1;
    for( i = n-1; i >= 0 ; i-- ){
      if( X[i] & Q ) {
	X[0] ^= P; /* invert */
      } else{ 
	t = (X[0]^X[i]) & P; X[0] ^= t; X[i] ^= t; /* exchange */
      }
    }
  }

}

int* EMSCRIPTEN_KEEPALIVE hilbert(const int dim, const int nbits, const long long int index){
    int* point[dim];
    memset(point, 0, dim);
    InttoTranspose(dim, index, point);
    TransposetoAxes(point, nbits, dim);
    return point;
}

void EMSCRIPTEN_KEEPALIVE fp(int* ptr){
    free(ptr);
}