## Helper functions for optimal teaching simulations

library(RCurl)
library(VGAM)

## load useful functions from langcog repo
eval(parse(text=getURL("https://raw.github.com/langcog/Ranalysis/master/useful.R",
                       ssl.verifypeer=FALSE)))

## plot beta distribution nicely
plot.beta <- function (a,b,...) {
  xs <- seq(0.01,.99,.01)
  ys <- dbeta(xs,a,b)
  ys <- ys / sum(ys) # normalize
  plot(xs,ys,bty="n",type="l",
       xaxp=c(0,1,2),yaxt="n",
       xlab="",ylab="",
       ...)
  midpoint <- xs[cumsum(ys)>.5][1]
  lines(c(midpoint,midpoint),c(0,1),lty=2,col="red")
}


## beta function (helper)
## from wikipedia: http://en.wikipedia.org/wiki/Beta_function
betafunc <- function (x,y) {
  b <- (gamma(x) * gamma(y)) / gamma(x+y)
}

## KL divergence between two betas
## from wikipedia: http://en.wikipedia.org/wiki/Beta_distribution
## a' is student's version, a is true
divergence <- function(a.prime,b.prime,a,b) {
  t1 <- log(betafunc(a.prime,b.prime) / betafunc(a,b))
  t2 <- (a - a.prime) * digamma(a)
  t3 <- (b - b.prime) * digamma(b)
  t4 <- (a.prime - a + b.prime - b) * digamma(a + b)
  dkl <- t1 + t2 + t3 + t4
  return(dkl)
}

## info gain for a move
info.gain <- function(a.old, b.old,
                      a.new, b.new,
                      a.true, b.true) {
  old.dkl <- divergence(a.old, b.old,
                   a.true, b.true)
  new.dkl <- divergence(a.new, b.new,
                        a.true, b.true)
  ig <- old.dkl - new.dkl # if new is smaller, we learned something
  return(ig)
}

## --- older functions ---

## analytic version of loss function via betting (not used currently)
student.loss <- function(a,b,c) {
  p <- dbetabinom.ab(1, 1, a, b)
  loss <- 1 - ((p * c) + ((1-p) * (1-c)))
  return(loss)
}

## plot analytic loss function via betting (not used)
plot.loss <- function(a,b,...) {
  xs <- seq(0.01,.99,.01)
  n <- length(xs)
  ys <- mapply(student.loss,rep(a,n),
         rep(b,n),xs)
  
  plot(xs,ys,bty="n",type="l",
       xaxp=c(0,1,2),ylim=c(0,1),
       xlab="",ylab="",...)
  midpoint <- xs[ys==min(ys)][1]
  lines(c(midpoint,midpoint),c(0,1),lty=2,col="red")
}

