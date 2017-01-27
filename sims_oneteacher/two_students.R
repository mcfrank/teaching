#### Simulations with two students - fully crossing

rm(list=ls())
source("helper.R")

#### optimal policy for two students - INFO THEORY VERSION ----
mus <- c(.1,.3,.5,.7,.9)
nus <- c(.1,.2,.5,1,2,5)
teacher.mus <- c(.1,.2,.3,.4,.5,.6,.7,.8,.9)
teacher.nu <- 10

d <- data.frame()
for (mu in mus) {
  for (nu in nus) {
    for (mu2 in mus) {
      for (nu2 in nus) {
        a <- mu * nu
        b <- (1 - mu) * nu
        a2 <- mu2 * nu2
        b2 <- (1 - mu2) * nu2
        
        ig.max <- sapply(teacher.mus, function (m) {
          ig.heads <- info.gain(a+1,b,a,b,m*teacher.nu,(1-m)*teacher.nu)
          ig.tails <- info.gain(a,b+1,a,b,m*teacher.nu,(1-m)*teacher.nu)
          ig.heads2 <- info.gain(a2+1,b2,a2,b2,m*teacher.nu,(1-m)*teacher.nu)
          ig.tails2 <- info.gain(a2,b2+1,a2,b2,m*teacher.nu,(1-m)*teacher.nu)
          ig.max <- max((ig.heads+ig.heads2)/2,
                        (ig.tails+ig.tails2)/2)
          return(ig.max)
        })
        
        d <- rbind(d,
                   data.frame(mu=mu,
                              nu=nu,
                              mu2=mu2,
                              nu2=nu2,
                              teacher.mu=teacher.mus,
                              teacher.nu=teacher.nu,
                              ig=ig.max))
      }
    }
  }
}

## average information gain goes down! (.83)
mean(d$ig)

## plot 
qplot(teacher.mu,ig,
      colour=mu2,linestyle=nu2,
      group=interaction(mu2,nu2),
      geom="line",
      facets=mu~nu,
      ylab="information gain (nats)",
      xlab="Teacher mu",
      data=d)

## try reducing by mu difference
d$mu.diff <- abs(d$mu - d$mu2)
d$nu.diff <- abs(d$nu - d$nu2)
qplot(teacher.mu,ig,
      group=interaction(mu2,nu2),
      geom="line",
      facets=mu.diff~nu.diff,
      ylab="information gain (nats)",
      xlab="Teacher mu",
      data=d)