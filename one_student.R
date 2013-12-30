rm(list=ls())
source("~/Projects/teaching/teaching_BB_helper.R")
source("~/Projects/R/Ranalysis/useful.R")

#### STUDENT EXAMPLE FIGURE ----
pdf("~/Projects/teaching/writeup/figures/students.pdf")
par(mfrow=c(3,3), mar=c(3,4,3,2)+0.1, oma=c(5,0,3,0)+0.1 )
plot.beta(.5,.5,main="beta(.5,.5)")
plot.beta(.5,1.5,main="+T")
plot.beta(1.5,.5,main="+H")

plot.beta(1,1,main="beta(1,1)")
plot.beta(1,2,main="+T")
plot.beta(2,1,main="+H")

plot.beta(2,2,main="beta(2,2)")
plot.beta(2,3,main="+T")
plot.beta(3,2,main="+H")
dev.off()

#### EXAMPLES OF LOSS ----
# guessing loss function
student.loss(1,5,.9)

## standard information gain function, assume base distribution is
## beta (3,7)
## TODO
info.gain(1,1,2,1,3,7)
info.gain(1,1,2,1,7,3)

#### optimal teaching policy for single student ----
# need to figure out what to do based on the student's parameters

# as <- c(.1, .2, .5, 1, 2, 5)
# bs <- c(.1, .2, .5, 1, 2, 5)
## convert to mu/nu parameterization
mus <- c(.1,.3,.5,.7,.9)
nus <- c(.1,.2,.5,1,2,5)
ts <- c(0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1)

d <- data.frame()
for (mu in mus) {
  for (nu in nus) {
    a <- mu * nu
    b <- (1 - mu) * nu
    ls.neutral <- sapply(ts, function (t) {
      l <- student.loss(a,b,t)
      return(l)
    })
    
    ls.h <- sapply(ts, function (t) {
      l <- student.loss(a+1,b,t)
      return(l)
    })

    ls.t <- sapply(ts, function (t) {
      l <- student.loss(a,b+1,t)
      return(l)
    })
       
    d <- rbind(d,
               data.frame(a=a,
                          b=b,
                          mu=mu,
                          nu=nu,
                          t=rep(ts,3),
                          l=c(ls.h,ls.t,ls.neutral),
                          strategy=c(rep("H",length(ts)),
                                     rep("T",length(ts)),
                                     rep("neutral",length(ts)))))
  }
}

## compute change in loss
d <- ddply(d, .(mu,nu,t),
      function(x) {
        x$dl <- x$l - x$l[x$strategy=="neutral"]
        return(x)
      })

# pdf("~/Projects/teaching/writeup/figures/single_student_loss.pdf",width=4.5,height=4.5)
qplot(t,dl,facets=mu~nu,
      colour=strategy,group=strategy,label=strategy,
      geom="line",
      xlab="test item",
      ylab="change in loss",
      data=subset(d,strategy!="neutral")) 
#+ geom_dl(method="last.qp") 
# dev.off()

# now for a single test item (t=1)
gain <- ddply(subset(d,t==.6), .(mu,nu),
             function(x) {
                nx <- data.frame(a=x$a[1],
                                 b=x$b[1],
                                 mu= x$mu[1],
                                 nu = x$nu[1],
                                 max.gain.strategy=x$strategy[x$dl==max(x$dl)],
                                 max.gain=max(x$dl))
               return(nx)})
             
qplot(mu,max.gain,colour=nu,group=nu,
      lty=max.gain.strategy,
      geom="line",
      data=gain)

#### optimal policy for a single student - INFO THEORY VERSION ----
## for these simulations, we need a true teacher distribution
## converted to mu/nu parameterization
mus <- c(.1,.3,.5,.7,.9)
nus <- c(.1,.2,.5,1,2,5)
teacher.mus <- c(.1,.2,.3,.4,.5,.6,.7,.8,.9)
teacher.nu <- 10

d <- data.frame()
for (mu in mus) {
  for (nu in nus) {
    a <- mu * nu
    b <- (1 - mu) * nu
    
    ig.max <- sapply(teacher.mus, function (m) {
      ig.heads <- info.gain(a+1,b,a,b,m*teacher.nu,(1-m)*teacher.nu)
      ig.tails <- info.gain(a,b+1,a,b,m*teacher.nu,(1-m)*teacher.nu)
      ig.max <- max(ig.heads,ig.tails)
      return(ig.max)
    })
        
    d <- rbind(d,
               data.frame(a=a,
                          b=b,
                          mu=mu,
                          nu=nu,
                          teacher.mu=teacher.mus,
                          teacher.nu=teacher.nu,
                          ig=ig.max))
  }
}

## plot 
qplot(teacher.mu,ig,
      geom="line",
      facets=mu~nu,
      ylab="information gain (nats)",
      xlab="Teacher mu",
      data=d)

## average info gain - .94
mean(d$ig) 

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

#### optimal policy for a number of students - INFO, probabilistic ----
## now assume 
n.students <- c(1, 2, 5, 10, 20, 50, 100)
n.sims <- 200

teacher.mus <- c(.5,.6,.7,.8,.9) # symmetric
teacher.nu <- 10

student.mu.params <- c(2,2) # for a beta distribution, uninformative
student.nu.params <- c(1,2) # for a gamma distribution, shape, scale

d <- data.frame()

start <- Sys.time()
for (n in n.students) {
  for (t in teacher.mus) {
    igs <- sapply(1:n.sims, function (x) {
      student.mus <- rbeta(n, student.mu.params[1], student.mu.params[2])
      student.nus <- rgamma(n, shape=student.nu.params[1],
                            scale=student.nu.params[2])
      
      ig.heads <- mapply(function(m,n) {
        info.gain((m*n)+1,(1-m)*n,
                  m*n,(1-m)*n,
                  t*teacher.nu,(1-t)*teacher.nu)
      }, student.mus, student.nus)
      
      ig.tails <- mapply(function(m,n) {
        info.gain((m*n),1+(1-m)*n,
                  m*n,(1-m)*n,
                  t*teacher.nu,(1-t)*teacher.nu)
      }, student.mus, student.nus)    
      
      ig <- max(mean(ig.heads),mean(ig.tails))
      return(ig)
    })
    
    d <- rbind(d,data.frame(n=n,
                            sim=i,
                            teacher.mu=t,
                            ig=igs))
  }
}
Sys.time() - start

d$teacher.mu <- factor(d$teacher.mu) # consolidate symmetric mus
ms <- aggregate(ig ~ teacher.mu + n, d, mean)
ms$sem <- aggregate(ig ~ teacher.mu + n, d, sem)$ig

## plot 
qplot(n,ig,colour=teacher.mu,group=teacher.mu,
      ymin=ig-sem,ymax=ig+sem,
      geom=c("line","linerange"),
      data=ms) +
  xlab("Number of students") + 
  ylab("Average information gain (nats)")

qplot(n,ig,colour=teacher.mu,group=teacher.mu,
      ymin=ig-sem,ymax=ig+sem,
      geom=c("line","linerange"),
      data=ms) +
  scale_x_continuous(trans="log10") +
  xlab("Number of students") + 
  ylab("Average information gain (nats)")

