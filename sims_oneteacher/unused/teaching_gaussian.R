rm(list=ls())
library(coda)
library(rjags)
library(bayesmix)

## SETTINGS
n.iter <- 1000
test.range <- seq(-4,4,.1)
ps <- data.frame()
N = 2 # number of data points


dists <- seq(0.125,1,.125)

## SIMULATION
for (d in dists) {
  
  y <- c(-d,d) # data points
  z <- c(0,1) # category assignments
  
  m <- jags.model("teaching_MOG.bug")  
  coda.res <- coda.samples(m,c("mu","sigma"),
                           n.iter=n.iter,
                           burn.in=100)
  tail(coda.res)
  colMeans(coda.res[[1]])
  
  p.cat <- function (samps,val) {
    cm <- colMeans(samps)
    p1 <- dnorm(val,cm[1],cm[3])
    p2 <- dnorm(val,cm[2],cm[4])
    p.cat <- p2 / (p1 + p2)
    return(p.cat)
  }
  
  ps <- rbind(ps, 
              data.frame(dist = d,
                         t = test.range,
                         p = p.cat(coda.res[[1]], test.range)))
}

ps$dist <- factor(ps$dist)
qplot(t,p,colour=dist,group=dist,geom="line",
      data=ps)
