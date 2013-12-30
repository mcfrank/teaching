## Class Variability

rm(list=ls())
source("helper.R")

#### optimal policy for a number of students - INFO, probabilistic ----
## now assume 
n.students <- c(30)
n.sims <- 1000

teacher.mus <- c(.5,.6,.7,.8,.9) # symmetric
teacher.nu <- 10

student.mu.params <- c(.2,5,1,2,5) # for a beta distribution, uninformative
student.nu.params <- c(1,2) # for a gamma distribution, shape, scale

d <- data.frame()

start <- Sys.time()
for (smp in student.mu.params) {
  for (t in teacher.mus) {
    igs <- sapply(1:n.sims, function (x) {
      # class is symmetric with smp
      student.mus <- rbeta(n.students, smp, smp)
      student.nus <- rgamma(n.students, shape=student.nu.params[1],
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
    
    d <- rbind(d,data.frame(student.mu.prior=smp,
                            teacher.mu=t,
                            ig=igs))
  }
}
Sys.time() - start

d$teacher.mu <- factor(d$teacher.mu) # consolidate symmetric mus
ms <- aggregate(ig ~ teacher.mu + student.mu.prior, d, mean)
ms$cih <- aggregate(ig ~ teacher.mu + student.mu.prior, d, ci.high)$ig
ms$cil <- aggregate(ig ~ teacher.mu + student.mu.prior, d, ci.low)$ig

## plot 
# quartz()
qplot(student.mu.prior,ig,colour=teacher.mu,group=teacher.mu,
      ymin=ig-cil,ymax=ig+cih,
      geom=c("line","linerange"),
      data=ms) +
  xlab("Student Uniformity (Student mu prior)") + 
  ylab("Average information gain (nats)")
