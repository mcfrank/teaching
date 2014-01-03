#### Tracking simulations for a single mis-tracked individual
rm(list=ls())
source("helper.R")

## parameters
n.students.total <- 96
n.classes <- 4
student.errs <- c(0,1,2,5,10,20) #

n.sims <- 1000
teacher.mu <- .75
teacher.nu <- 10

student.mu.params <- c(1,1) # for a beta distribution, uninformative
student.nu.params <- c(1,2) # for a gamma distribution, shape, scale

## simulation code
d <- data.frame()

start <- Sys.time()
for (n in n.students.total) {
  for (cs in n.classes) {
    for (e in student.errs) {
    
      ## tracked simulations    
      igs.tracked <- sapply(1:n.sims, function (x) {
        ## generate students first
        student.mus <- rbeta(n, student.mu.params[1], student.mu.params[2])
        student.nus <- rgamma(n, shape=student.nu.params[1],
                              scale=student.nu.params[2])
        
        ## choose the odd man out - student 1
        ## was mis-sorted because of error
        oddman.true.mu <- student.mus[1]
        oddman.true.nu <- student.nus[1]
        oddman.true.a <-  (1 - oddman.true.mu) * oddman.true.nu
        oddman.true.b <- oddman.true.mu * oddman.true.nu
        
        # randomly increment one or the other
        if (runif(1) > .5) { 
          oddman.mixup.a <- oddman.true.a + e
          oddman.mixup.b <- oddman.true.b
        } else {
          oddman.mixup.a <- oddman.true.a
          oddman.mixup.b <- oddman.true.b + e
        }
        
        # now return this value to class array
        oddman.mixup.mu <- oddman.mixup.b / (oddman.mixup.a + oddman.mixup.b)
        oddman.mixup.nu <- oddman.mixup.a + oddman.mixup.b
        student.mus[1] <- oddman.mixup.mu
        student.nus[1] <- oddman.mixup.nu
        
        ## now sort the students by bias
        sorted <- sort(student.mus, index.return=TRUE)      
        student.mus <- sorted$x
        student.nus <- student.nus[sorted$ix]
        
        oddman.idx <- (1:length(sorted$ix))[sorted$ix==1]
                
        class.size <- n/cs # students per class
        
        # for each class
        ig.max.c <- array(dim=cs)
        ig.strat.c <- array(dim=cs)
        for (i in 1:cs) {
          # get students for each class
          student.mus.c <- student.mus[(1 + (i-1)*class.size) : (i*class.size)]
          student.nus.c <- student.nus[(1 + (i-1)*class.size) : (i*class.size)]
          
          # get info gain for best strategy
          igs <- maximize.ig(student.mus.c, student.nus.c, 
                             teacher.mu, teacher.nu,
                             return.list=TRUE)
          ig.max.c[i] <- igs$max
          ig.strat.c[i] <- igs$strategy
        }
        
        ig.max <- mean(ig.max.c)
              
        # now get information gain for misclassified student, given strategy
        oddman.class <- floor((oddman.idx-1)/class.size) + 1
        oddman.strat <- ig.strat.c[oddman.class]
        
        if (oddman.strat=="H") {
          ig.oddman <- info.gain(oddman.true.a,oddman.true.b,
                                 oddman.true.a+1,oddman.true.b,
                                 (1-teacher.mu)*teacher.nu,teacher.mu*teacher.nu)
        } else {
          ig.oddman <- info.gain(oddman.true.a,oddman.true.b,
                                 oddman.true.a,oddman.true.b+1,
                                 (1-teacher.mu)*teacher.nu,teacher.mu*teacher.nu)
        }
        
        ig.oddman.class <- ig.max.c[oddman.class]
        return(c(ig.max,ig.oddman.class,ig.oddman,abs(oddman.true.mu-oddman.mixup.mu)))
      })
      
      d <- rbind(d,data.frame(n=n,
                              n.classes=cs,
                              class.size=n/cs,
                              tracking="Tracked Classes",
                              oddman.err=e,
                              mu.diff=igs.tracked[4,],
                              ig.avg=igs.tracked[1,],
                              ig.oddman.class=igs.tracked[2,],
                              ig.oddman=igs.tracked[3,]))
    }
  }
}
Sys.time() - start

md <- melt(d, id.vars=c("oddman.err"), measure.vars=c("ig.avg","ig.oddman"),
           variable.name="group",value.name="ig")
ms <- aggregate(ig ~ group + oddman.err, md, mean)
ms$cil <- aggregate(ig ~ group + oddman.err, md, ci.low)$ig
ms$cih <- aggregate(ig ~ group + oddman.err, md, ci.high)$ig

ms$group <- revalue(ms$group,c("ig.avg"="Average",
                   "ig.oddman"="Mismeasured"))
        
## plot
quartz()
qplot(oddman.err,ig,colour=group,group=group,
      label=group,
      ymin=ig-cil,ymax=ig+cih,    
      geom=c("line","linerange"),
      data=ms) +
  xlab("Measurement error (Pseudocounts)") + 
  ylab("Average information gain (nats)") + 
  scale_colour_discrete(name="Student") 


# 
# qplot(mu.diff,ig.oddman,colour=factor(oddman.err),
#       geom="point",
#       data=d) +
#   xlab("Class Size") + 
#   ylab("Average information gain (nats)") 
# 
# 
# 
