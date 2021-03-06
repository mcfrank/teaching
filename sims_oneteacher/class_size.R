## Class size simulations

rm(list=ls())
source("helper.R")

#### optimal policy for a number of students - INFO, probabilistic ----
## now assume 
n.students <- c(1, 2, 5, 10, 20, 50, 100)
n.sims <- 1000

teacher.mus <- c(.5,.6,.7,.8,.9) # symmetric
teacher.nu <- 10

student.mu.params <- c(1,1) # for a beta distribution, uninformative
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
                            teacher.mu=t,
                            ig=igs))
  }
}
Sys.time() - start

d$teacher.mu <- factor(d$teacher.mu) # consolidate symmetric mus
ms <- aggregate(ig ~ teacher.mu + n, d, mean)
ms$cih <- aggregate(ig ~ teacher.mu + n, d, ci.high)$ig
ms$cil <- aggregate(ig ~ teacher.mu + n, d, ci.low)$ig

## plot 
quartz()
qplot(n,ig,colour=teacher.mu,group=teacher.mu,
      ymin=ig-cil,ymax=ig+cih,
      geom=c("line","linerange"),
      data=ms) +
  xlab("Number of students") + 
  ylab("Average information gain (nats)") + 
  geom_dl(aes(label=teacher.mu),method="last.qp")

# qplot(n,ig,colour=teacher.mu,group=teacher.mu,
#       ymin=ig-sem,ymax=ig+sem,
#       geom=c("line","linerange"),
#       data=ms) +
#   scale_x_continuous(trans="log10") +
#   xlab("Number of students") + 
#   ylab("Average information gain (nats)")
# 
